import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Copy, Check, UserPlus, Search, Users, LogOut, 
  Camera, Sparkles, Send, Bell, ArrowRight, Shield 
} from 'lucide-react';
import { User, Friend, RoomInvite, Room } from '../types';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentRoom: Room | null;
  onUpdateUser: (updated: User) => void;
  onLogout: () => void;
  onJoinFromInvite: (invite: RoomInvite) => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  currentRoom,
  onUpdateUser,
  onLogout,
  onJoinFromInvite
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invites, setInvites] = useState<RoomInvite[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Load user's friends & invites
  useEffect(() => {
    if (isOpen && user?.userId) {
      loadFriends();
      loadInvites();
    }
  }, [isOpen, user?.userId]);

  const loadFriends = async () => {
    try {
      const res = await fetch(`/api/friends/${user.userId}`);
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends || []);
      }
    } catch (e) {}
  };

  const loadInvites = async () => {
    try {
      const res = await fetch(`/api/rooms/invites/${user.userId}`);
      const data = await res.json();
      if (data.success) {
        setInvites(data.invites || []);
      }
    } catch (e) {}
  };

  // Copy Account ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(user.userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Search User by Account ID
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?accountId=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results.filter((u: any) => u.userId !== user.userId));
      }
    } catch (e) {
    } finally {
      setIsSearching(false);
    }
  };

  // Add Friend
  const handleAddFriend = async (friend: Friend) => {
    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: user.userId, friendUserId: friend.userId })
      });
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends);
        setSearchResults([]);
        setSearchQuery('');
        setNotificationMsg(`🎉 ${friend.name} ফ্রেন্ডলিস্টে যুক্ত হয়েছে!`);
        setTimeout(() => setNotificationMsg(null), 3000);
      }
    } catch (e) {}
  };

  // Invite Friend to Current Room
  const handleInviteToRoom = async (friend: Friend) => {
    if (!currentRoom) {
      alert('ইনভাইট পাঠাতে হলে আগে কোনো রুমে থাকতে হবে!');
      return;
    }

    try {
      const res = await fetch('/api/rooms/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: currentRoom.roomId,
          roomPassword: currentRoom.password || '123',
          fromUserId: user.userId,
          fromUserName: user.name,
          toUserId: friend.userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotificationMsg(`🚀 ${friend.name} কে রুমে ইনভাইট পাঠানো হয়েছে!`);
        setTimeout(() => setNotificationMsg(null), 3000);
      }
    } catch (e) {}
  };

  // Avatar Upload (Local File to Base64)
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('ছবির সাইজ সর্বোচ্চ 2MB হতে হবে!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadingAvatar(true);
      try {
        const res = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, avatar: base64 })
        });
        const data = await res.json();
        if (data.success) {
          onUpdateUser(data.user);
          setNotificationMsg('ছবি সফলভাবে পরিবর্তন করা হয়েছে!');
          setTimeout(() => setNotificationMsg(null), 3000);
        }
      } catch (err) {
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-0 left-0 bottom-0 w-full max-w-sm bg-slate-900 border-r border-purple-500/30 flex flex-col shadow-2xl z-10 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-purple-500/20 flex items-center justify-between bg-slate-950/60 sticky top-0 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎵</span>
                <h3 className="font-bold text-white text-base">ইউজার প্রোফাইল ও ফ্রেন্ডস</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close Profile Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification alert */}
            {notificationMsg && (
              <div className="m-3 p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs text-center animate-bounce">
                {notificationMsg}
              </div>
            )}

            <div className="p-4 space-y-6 flex-1">
              {/* Profile Card */}
              <div className="bg-gradient-to-b from-purple-950/40 to-slate-950/60 border border-purple-500/30 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-lg">
                <div className="relative group mb-3">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-purple-500 ring-4 ring-purple-500/20 shadow-md"
                  />
                  {/* Photo Upload Trigger */}
                  <label className="absolute bottom-0 right-0 p-1.5 bg-purple-600 hover:bg-purple-500 rounded-full text-white cursor-pointer shadow transition hover:scale-110">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-lg text-white">{user.name}</h4>
                  {user.isAdmin && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{user.email}</p>

                {/* Random Account ID Box with Copy */}
                <div className="mt-4 w-full bg-slate-950 border border-purple-500/40 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold text-purple-400">আপনার একাউন্ট আইডি</div>
                    <div className="font-mono text-sm font-extrabold text-pink-400 tracking-wider">
                      {user.userId}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyId}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold border border-purple-500/40 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> কপি হয়েছে
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> কপি করুন
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  এই আইডি বন্ধুদের সাথে শেয়ার করুন যেন তারা আপনাকে ফ্রেন্ডে যুক্ত বা ইনভাইট করতে পারে!
                </p>
              </div>

              {/* Inbound Room Invites Section */}
              {invites.length > 0 && (
                <div className="bg-pink-950/30 border border-pink-500/30 rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-300 mb-2">
                    <Bell className="w-4 h-4 text-pink-400 animate-bounce" />
                    <span>রুম ইনভাইটেশন ({invites.length})</span>
                  </div>
                  <div className="space-y-2">
                    {invites.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-slate-900/90 border border-pink-500/20 p-2.5 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="text-xs">
                          <span className="font-bold text-white">{inv.fromUserName}</span>
                          <span className="text-slate-400"> আপনাকে রুম </span>
                          <span className="font-mono font-bold text-pink-300">#{inv.roomId}</span>
                          <span className="text-slate-400"> এ ইনভাইট করেছে!</span>
                        </div>
                        <button
                          onClick={() => {
                            onJoinFromInvite(inv);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs shadow hover:brightness-110 active:scale-95 shrink-0 transition cursor-pointer"
                        >
                          Join Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friend Search by Account ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-purple-400" /> আইডি দিয়ে ফ্রেন্ড খুঁজুন
                </label>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="BP-XXXXXX"
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {isSearching ? '...' : 'খুঁজুন'}
                  </button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-2 space-y-2">
                    {searchResults.map((res) => (
                      <div key={res.userId} className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-2">
                          <img src={res.avatar} alt={res.name} className="w-8 h-8 rounded-full object-cover" />
                          <div className="text-left">
                            <div className="text-xs font-bold text-white">{res.name}</div>
                            <div className="text-[10px] text-purple-400 font-mono">{res.userId}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddFriend(res)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                        >
                          + ফ্রেন্ড যুক্ত করুন
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Friends List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" /> আপনার ফ্রেন্ডলিস্ট ({friends.length})
                  </label>
                </div>

                {friends.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    এখনো কোনো ফ্রেন্ড যোগ করা হয়নি। উপরের বক্স থেকে আইডি দিয়ে ফ্রেন্ড যুক্ত করুন!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {friends.map((f) => (
                      <div
                        key={f.userId}
                        className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <img src={f.avatar} alt={f.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                          <div className="text-left">
                            <div className="text-xs font-semibold text-white truncate max-w-[110px]">{f.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{f.userId}</div>
                          </div>
                        </div>

                        {currentRoom && (
                          <button
                            onClick={() => handleInviteToRoom(f)}
                            className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 border border-purple-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="রুমে ইনভাইট পাঠান"
                          >
                            <Send className="w-3 h-3 text-pink-400" /> ইনভাইট
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-purple-500/20 bg-slate-950/80 sticky bottom-0">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400" /> লগআউট করুন
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
