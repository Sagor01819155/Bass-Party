import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Users, Radio, Settings, Mail, Database, 
  Trash2, CheckCircle2, AlertTriangle, Save, RefreshCw, 
  Download, Copy, Check, ExternalLink, X, Sparkles, KeyRound 
} from 'lucide-react';
import { SiteSettings, User } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: SiteSettings;
  onUpdateSettings: (newSettings: Partial<SiteSettings>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rooms' | 'branding' | 'emailjs' | 'mysql'>('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRooms: 0,
    onlineConnections: 0,
    verifiedUsers: 0
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Editable Settings state
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAdminData();
      setFormData(settings);
    }
  }, [isOpen, settings]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: {
          'x-admin-email': 'mdsagorirfan@gmail.com',
          'x-admin-pass': 'Sagor9155'
        }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setUsersList(data.users);
        setRoomsList(data.rooms);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: 'mdsagorirfan@gmail.com',
          adminPassword: 'Sagor9155',
          newSettings: formData
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateSettings(formData);
        setActionMsg('✅ সাইট সেটিংস সফলভাবে সেভ করা হয়েছে!');
        setTimeout(() => setActionMsg(null), 3500);
      }
    } catch (e) {
      setActionMsg('❌ সেটিংস সেভ করতে সমস্যা হয়েছে!');
    }
  };

  const handleCloseRoom = async (roomId: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে রুম #${roomId} বন্ধ করতে চান?`)) return;

    try {
      const res = await fetch('/api/admin/delete-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`রুম #${roomId} বন্ধ করা হয়েছে!`);
        loadAdminData();
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (e) {}
  };

  const handleVerifyUser = async (email: string) => {
    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`ইউজার (${email}) ভেরিফাই সম্পন্ন!`);
        loadAdminData();
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/40">
              <Shield className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-lg sm:text-xl">
                  Bass Party সুপার অ্যাডমিন প্যানেল
                </h3>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                লগইন হিসেবে আছেন: <strong className="text-pink-300 font-mono">mdsagorirfan@gmail.com</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close Admin Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback */}
        {actionMsg && (
          <div className="p-3 bg-purple-950/80 border-b border-purple-500/40 text-center text-xs font-bold text-pink-300 animate-pulse">
            {actionMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'ওভারভিউ ও অ্যানালিটিক্স', icon: Shield },
            { id: 'rooms', label: 'লাইভ পার্টি রুমস', icon: Radio },
            { id: 'users', label: 'ইউজার ম্যানেজমেন্ট', icon: Users },
            { id: 'branding', label: 'ব্র্যান্ডিং ও রঙ', icon: Settings },
            { id: 'emailjs', label: 'EmailJS কনফিগ', icon: Mail },
            { id: 'mysql', label: 'MySQL & install.php', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-900/60">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-purple-500/30 p-4 rounded-2xl text-center">
                  <div className="text-2xl sm:text-3xl font-black text-purple-400">{stats.totalUsers}</div>
                  <div className="text-xs text-slate-400 mt-1">মোট রেজিস্টার্ড ইউজার</div>
                </div>
                <div className="bg-slate-950/80 border border-pink-500/30 p-4 rounded-2xl text-center">
                  <div className="text-2xl sm:text-3xl font-black text-pink-400">{stats.activeRooms}</div>
                  <div className="text-xs text-slate-400 mt-1">সক্রিয় পার্টি রুম</div>
                </div>
                <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-2xl text-center">
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400">{stats.onlineConnections}</div>
                  <div className="text-xs text-slate-400 mt-1">লাইভ সকেট কানেকশন</div>
                </div>
                <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-2xl text-center">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.verifiedUsers}</div>
                  <div className="text-xs text-slate-400 mt-1">ভেরিফাইড একাউন্ট</div>
                </div>
              </div>

              {/* Quick Actions & Security Banner */}
              <div className="bg-gradient-to-r from-purple-950/50 to-pink-950/30 border border-purple-500/30 p-5 rounded-2xl">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Bass Party সিস্টেম স্ট্যাটাস
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  সবগুলো রিয়েল-টাইম সিনক্রোনাইজেশন ইঞ্জিন সচল রয়েছে। ইউটিউব আইফ্রেম প্লেয়ার ও সকেট ব্রডকাস্টার সব মেম্বারদের ফোনে এক সেকেন্ডেরও কম সময়ে (Zero Audio Drift) গান প্লে করছে।
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-mono text-purple-300">
                  <span>URL: https://bassparty.free.nf</span>
                  <span>•</span>
                  <span>SEO: সচল (sitemap.xml তৈরি)</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. LIVE ROOMS TAB */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">বর্তমানে চলমান রুমের তালিকা</h4>
                <button
                  onClick={loadAdminData}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
                </button>
              </div>

              {roomsList.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  এখনো কোনো সক্রিয় পার্টি রুম নেই।
                </div>
              ) : (
                <div className="space-y-3">
                  {roomsList.map((room) => (
                    <div
                      key={room.roomId}
                      className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">#{room.roomId}</span>
                          <span className="text-xs text-pink-400 font-mono">পাসওয়ার্ড: {room.password}</span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1">
                          গান: <strong className="text-purple-300">{room.currentTitle}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          হোস্ট: {room.ownerName} • সদস্য: {room.memberCount} জন
                        </div>
                      </div>

                      <button
                        onClick={() => handleCloseRoom(room.roomId)}
                        className="px-3 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> রুম বন্ধ করুন
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. USER MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">সকল ব্যবহারকারী ({usersList.length})</h4>
                <button
                  onClick={loadAdminData}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-purple-500/40" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{u.name}</span>
                          <span className="font-mono text-[10px] text-pink-400">{u.userId}</span>
                          {u.isAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {u.isVerified ? (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ভেরিফাইড
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyUser(u.email)}
                          className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 border border-amber-500/30 rounded-lg text-xs font-semibold transition"
                        >
                          ভেরিফাই করুন
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. BRANDING & COLORS TAB */}
          {activeTab === 'branding' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ওয়েবসাইটের নাম (Site Name)</label>
                <input
                  type="text"
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ওয়েবসাইট লোগো / ট্যাগ</label>
                <input
                  type="text"
                  value={formData.siteLogo}
                  onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ওয়েবসাইট URL (SEO & Canonical)</label>
                <input
                  type="text"
                  value={formData.siteUrl}
                  onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">অ্যানাউন্সমেন্ট ব্যানার বার্তা</label>
                <textarea
                  value={formData.announcement}
                  onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> ব্র্যান্ডিং ও সেটিংস সেভ করুন
              </button>
            </form>
          )}

          {/* 5. EMAILJS CONFIGURATION TAB */}
          {activeTab === 'emailjs' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-xl text-xs text-purple-200">
                <p className="font-semibold mb-1">📧 EmailJS ইন্টিগ্রেশন সেটিংস</p>
                <p className="text-slate-300">
                  EmailJS.com ড্যাশবোর্ড থেকে প্রাপ্ত Service ID, Template ID এবং Public Key এখানে বসান। ব্যবহারকারীরা যখন একাউন্ট খুলবে, তাদের ইমেইলে স্বয়ংক্রিয়ভাবে ৬ ডিজিটের কোড চলে যাবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">EmailJS Service ID</label>
                <input
                  type="text"
                  value={formData.emailjsServiceId}
                  onChange={(e) => setFormData({ ...formData, emailjsServiceId: e.target.value })}
                  placeholder="service_xxxxxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">EmailJS Template ID</label>
                <input
                  type="text"
                  value={formData.emailjsTemplateId}
                  onChange={(e) => setFormData({ ...formData, emailjsTemplateId: e.target.value })}
                  placeholder="template_xxxxxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">EmailJS Public Key (User ID)</label>
                <input
                  type="text"
                  value={formData.emailjsPublicKey}
                  onChange={(e) => setFormData({ ...formData, emailjsPublicKey: e.target.value })}
                  placeholder="pk_xxxxxxxxxxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> EmailJS ডাটা আপডেট করুন
              </button>
            </form>
          )}

          {/* 6. MYSQL & INSTALL.PHP HUB */}
          {activeTab === 'mysql' && (
            <div className="space-y-5">
              <div className="bg-slate-950 border border-purple-500/30 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-base font-bold text-white mb-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  ১-ক্লিকে MySQL ডাটাবেস অটোমেটিক সেটআপ (install.php)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  আপনার অনুরোধ অনুযায়ী <span className="font-mono text-purple-300">install.php</span> এবং <span className="font-mono text-pink-300">schema.sql</span> তৈরি করা হয়েছে! এটি দিয়ে InfinityFree (free.nf), cPanel বা যে কোনো MySQL হোস্টিংয়ে ডাটাবেসের টেবিল ও অ্যাডমিন অটোমেটিক ইন্সটল হয়ে যাবে।
                </p>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/install.php"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
                  >
                    <ExternalLink className="w-4 h-4" /> install.php সরাসরি রান করুন
                  </a>

                  <a
                    href="/schema.sql"
                    download="schema.sql"
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-purple-500/30"
                  >
                    <Download className="w-4 h-4" /> schema.sql ডাউনলোড করুন
                  </a>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-slate-200">free.nf বা InfinityFree তে ব্যবহারের নিয়ম:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>InfinityFree cPanel থেকে একটি নতুন MySQL Database তৈরি করুন।</li>
                  <li>আপনার ডোমেইনে <code className="text-purple-300">install.php</code> ফাইলটি রান করুন (উদা: <code className="text-pink-300">https://bassparty.free.nf/install.php</code>)।</li>
                  <li>হোস্ট, ডাটাবেস নাম ও পাসওয়ার্ড দিয়ে "ইন্সটল" বাটনে ক্লিক করুন।</li>
                  <li>সবগুলো ৬টি টেবিল (users, rooms, room_members, friends, room_invites, site_settings) এবং অ্যাডমিন একাউন্ট (<strong className="text-white">mdsagorirfan@gmail.com / Sagor9155</strong>) অটোমেটিক তৈরি হয়ে যাবে!</li>
                </ol>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
