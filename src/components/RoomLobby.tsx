import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, LogIn, Radio, Users, Music2, Shield, 
  Sparkles, KeyRound, Play, Flame, ArrowRight, Disc 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Room } from '../types';

interface RoomLobbyProps {
  user: User;
  onCreateRoom: (roomId: string, pass: string) => Promise<boolean>;
  onJoinRoom: (roomId: string, pass: string) => Promise<boolean>;
  activeRooms: any[];
  onRefreshRooms: () => void;
  siteName: string;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  user,
  onCreateRoom,
  onJoinRoom,
  activeRooms,
  onRefreshRooms,
  siteName
}) => {
  const [modalType, setModalType] = useState<'create' | 'join' | null>(null);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Entrance cheer effect
  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.3 }
      });
    } catch (e) {}
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !password.trim()) {
      setError('রুম আইডি এবং পাসওয়ার্ড দেওয়া বাধ্যতামূলক!');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ok = await onCreateRoom(roomId.trim(), password.trim());
      if (ok) {
        setModalType(null);
      } else {
        setError('রুম খুলতে ব্যর্থ হয়েছে! অন্য আইডি দিয়ে চেষ্টা করুন।');
      }
    } catch (err: any) {
      setError(err.message || 'এরর ঘটেছে');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !password.trim()) {
      setError('রুম আইডি এবং পাসওয়ার্ড দিন!');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ok = await onJoinRoom(roomId.trim(), password.trim());
      if (ok) {
        setModalType(null);
      } else {
        setError('ভুল রুম আইডি অথবা পাসওয়ার্ড!');
      }
    } catch (err: any) {
      setError(err.message || 'এরর ঘটেছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      
      {/* Welcome Hero Banner with Animated Bass Speakers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/70 border border-purple-500/30 p-6 sm:p-10 shadow-2xl shadow-purple-950/50"
      >
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span>লাইভ পার্টি মিউজিক সিনক্রোনাইজার</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            একসাথে গান শুনুন, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300">
              এক সেকেন্ডেরও তফাৎ ছাড়া!
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            স্বাগতম <strong className="text-white">{user.name}</strong>! আপনি যে গান বাজাবেন, রুমে থাকা সকল বন্ধুদের মোবাইলে ইউটিউব থেকে একই সময়ে সেই একই গান বাজবে।
          </p>

          {/* TWO PROMINENT PARTY ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            {/* Create Room Button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setError(null);
                setRoomId(`PARTY-${Math.floor(100 + Math.random() * 900)}`);
                setPassword('123');
                setModalType('create');
              }}
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-purple-600/40 transition flex items-center gap-2.5 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>ক্রিয়েট রুম (Create Room)</span>
            </motion.button>

            {/* Join Room Button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setError(null);
                setRoomId('');
                setPassword('');
                setModalType('join');
              }}
              className="px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-purple-200 hover:text-white border-2 border-purple-500/50 font-extrabold text-sm sm:text-base shadow-xl transition flex items-center gap-2.5 cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-pink-400" />
              <span>জয়েন রুম (Join Room)</span>
            </motion.button>
          </div>
        </div>

        {/* Decorative Floating Soundbox graphic in corner */}
        <div className="hidden lg:block absolute -right-6 -bottom-6 w-72 h-72 opacity-40 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl"></div>
        </div>
      </motion.div>

      {/* Active Party Rooms section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-pink-400 animate-pulse" />
            <h3 className="font-extrabold text-white text-lg sm:text-xl">
              চলমান পার্টি রুম ({activeRooms.length})
            </h3>
          </div>
          <button
            onClick={onRefreshRooms}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            ↻ রিফ্রেশ রুমস
          </button>
        </div>

        {activeRooms.length === 0 ? (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-3">
            <Disc className="w-10 h-10 text-purple-400 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
            <p className="text-sm font-semibold text-slate-300">
              বর্তমানে কোনো পাবলিক রুম নেই! নিজেই একটি নতুন রুম খুলুন।
            </p>
            <button
              onClick={() => {
                setRoomId(`PARTY-${Math.floor(100 + Math.random() * 900)}`);
                setPassword('123');
                setModalType('create');
              }}
              className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 text-xs font-bold"
            >
              + এখনই নতুন রুম খুলুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRooms.map((room) => (
              <div
                key={room.roomId}
                className="bg-slate-900/80 border border-purple-500/30 hover:border-pink-500/50 rounded-2xl p-5 backdrop-blur-md transition group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-lg text-white group-hover:text-pink-400 transition">
                      #{room.roomId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      লাইভ
                    </span>
                  </div>

                  <div className="text-xs text-purple-300 font-medium line-clamp-1 mb-1">
                    🎵 {room.currentTitle || 'Bass Beat Track'}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>হোস্ট: <strong className="text-slate-300">{room.ownerName}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-pink-300">
                      <Users className="w-3.5 h-3.5" /> {room.memberCount} জন
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">পাসওয়ার্ড সুরক্ষিত</span>
                  <button
                    onClick={() => {
                      setRoomId(room.roomId);
                      setPassword('');
                      setModalType('join');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    জয়েন করুন <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / JOIN MODAL */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-600/30 mb-3">
                  {modalType === 'create' ? <PlusCircle className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
                </div>
                <h3 className="text-2xl font-black text-white">
                  {modalType === 'create' ? 'নতুন পার্টি রুম খুলুন' : 'প্রাইভেট রুমে প্রবেশ করুন'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {modalType === 'create'
                    ? 'আপনার ইচ্ছামতো রুম আইডি ও পাসওয়ার্ড দিয়ে রুম খুলুন'
                    : 'বন্ধুর দেওয়া রুম আইডি ও পাসওয়ার্ড বসিয়ে জয়েন করুন'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={modalType === 'create' ? handleCreateSubmit : handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">রুম আইডি (Room ID)</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="যেমন: PARTY-101"
                    required
                    className="w-full uppercase font-mono bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-pink-400" /> রুম পাসওয়ার্ড (Password)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন"
                    required
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'প্রক্রিয়াধীন...' : modalType === 'create' ? 'রুম ক্রিয়েট করুন' : 'রুমে প্রবেশ করুন'}
                </button>

                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white transition"
                >
                  বাতিল করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
