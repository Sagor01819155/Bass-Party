import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { LogIn, UserPlus, KeyRound, Mail, User as UserIcon, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { CartoonSquad, SquadPhase } from './CartoonSquad';
import { User } from '../types';

interface AuthModalProps {
  onSuccess: (user: User) => void;
  siteName: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, siteName }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [squadPhase, setSquadPhase] = useState<SquadPhase>('walking_in');
  const [isCardVisible, setIsCardVisible] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [serverVerificationCode, setServerVerificationCode] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initial Cartoon Entrance Sequence
  useEffect(() => {
    // 1. Walking in from left
    const t1 = setTimeout(() => {
      setSquadPhase('gathering');
    }, 1100);

    // 2. High-fiving and raising hands
    const t2 = setTimeout(() => {
      setSquadPhase('raising_hands');
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }, 2200);

    // 3. Card opens from center, squad stands around it
    const t3 = setTimeout(() => {
      setSquadPhase('settled');
      setIsCardVisible(true);
    }, 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Handle Mode Switch with Cartoon High-Five Choreography
  const switchMode = (newMode: 'login' | 'signup') => {
    setError(null);
    setSuccessMsg(null);
    // 1. Hide current card
    setIsCardVisible(false);

    // 2. Cartoons gather in center
    setTimeout(() => {
      setSquadPhase('gathering');
    }, 250);

    // 3. Hands up in the air
    setTimeout(() => {
      setSquadPhase('raising_hands');
      setMode(newMode);
    }, 850);

    // 4. Reveal new form and settle squad
    setTimeout(() => {
      setSquadPhase('settled');
      setIsCardVisible(true);
    }, 1500);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('ইমেইল এবং পাসওয়ার্ড দিন!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.isUnverified) {
          setError(data.message);
          setMode('verify');
          return;
        }
        throw new Error(data.message || 'লগইন ব্যর্থ হয়েছে!');
      }

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('সবগুলো তথ্য পূরণ করুন!');
      return;
    }

    if (password.length < 4) {
      setError('পাসওয়ার্ড ন্যূনতম ৪ অক্ষরের হতে হবে!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে!');
      }

      setServerVerificationCode(data.verificationCodeDemo);
      setSuccessMsg(`ভেরিফিকেশন কোড ${email} এ পাঠানো হয়েছে!`);
      setMode('verify');
      
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {}
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify Code handler
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('৬ ডিজিটের ভেরিফিকেশন কোড দিন!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'ভেরিফিকেশন ব্যর্থ হয়েছে!');
      }

      try {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      } catch (e) {}

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill admin credentials for testing
  const fillAdmin = () => {
    setEmail('mdsagorirfan@gmail.com');
    setPassword('Sagor9155');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-radial from-purple-950/60 via-slate-950 to-black overflow-hidden p-4">
      {/* Dynamic Party Lighting in background */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-10 inset-x-0 mx-auto w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 10 Animated Cartoon Characters Squad */}
      <CartoonSquad phase={squadPhase} />

      {/* Center Auth Card (Opens as hands go up!) */}
      <AnimatePresence mode="wait">
        {isCardVisible && (
          <motion.div
            key={mode}
            initial={{ scale: 0.2, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.2, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="relative z-30 w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80"
          >
            {/* Header with pulsating sound wave */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-inner mb-3">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
                <span>{siteName} Party Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-200">
                {mode === 'login' && 'লগইন করুন'}
                {mode === 'signup' && 'নতুন একাউন্ট খুলুন'}
                {mode === 'verify' && 'ইমেইল ভেরিফিকেশন'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'login' && 'বন্ধুদের সাথে লাইভ মিউজিক পার্টিতে জয়েন করতে লগইন করুন'}
                {mode === 'signup' && 'নাম, ইমেইল ও পাসওয়ার্ড দিয়ে ফ্রিতে একাউন্ট তৈরি করুন'}
                {mode === 'verify' && 'আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোডটি বসান'}
              </p>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* 1. LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" /> ইমেইল ঠিকানা
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" /> পাসওয়ার্ড
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                  />
                </div>

                {/* Quick Admin fill button for owner */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={fillAdmin}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                  >
                    <ShieldCheck className="w-3 h-3" /> অ্যাডমিন একাউন্ট অটো-ফিল
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
                </button>

                {/* Sign Up switch button */}
                <div className="pt-4 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400 mb-2">একাউন্ট নেই?</p>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-purple-300 hover:text-white text-xs font-semibold border border-purple-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> নতুন একাউন্ট সাইন আপ করুন
                  </button>
                </div>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-pink-400" /> আপনার নাম
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: Sagor Irfan"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-pink-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-pink-400" /> ইমেইল ঠিকানা
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-pink-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-pink-400" /> পাসওয়ার্ড
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-pink-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'কোড পাঠানো হচ্ছে...' : 'ক্রিয়েট করুন ও কোড পান'}
                </button>

                <div className="pt-4 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400 mb-2">ইতোমধ্যে একাউন্ট আছে?</p>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-purple-300 hover:text-white text-xs font-semibold border border-purple-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" /> লগইন পেজে ফিরে যান
                  </button>
                </div>
              </form>
            )}

            {/* 3. VERIFY CODE FORM */}
            {mode === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200">
                  <p className="font-semibold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-400" /> EmailJS ভেরিফিকেশন সিস্টেম
                  </p>
                  <p className="text-slate-300">
                    কোড পাঠানো হয়েছে <span className="font-mono text-purple-300">{email}</span> ঠিকানায়।
                  </p>
                  {serverVerificationCode && (
                    <div className="mt-2 bg-slate-900/90 border border-purple-500/50 p-2 rounded-lg flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">আপনার ভেরিফিকেশন কোড:</span>
                      <span className="font-mono text-base font-extrabold text-pink-400 tracking-wider">
                        {serverVerificationCode}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> ৬ ডিজিটের কোড বসান
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full text-center font-mono text-xl tracking-[0.4em] bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
                  />
                </div>

                {serverVerificationCode && (
                  <button
                    type="button"
                    onClick={() => setVerificationCode(serverVerificationCode)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline block text-center w-full"
                  >
                    অটো কোড বসান ({serverVerificationCode})
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? 'ভেরিফাই হচ্ছে...' : 'একাউন্ট ভেরিফাই করুন'}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    ← লগইন পেজে ফিরে যান
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
