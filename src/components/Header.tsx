import React from 'react';
import { Menu, Shield, Radio, Volume2, LogOut, Users } from 'lucide-react';
import { User, Room } from '../types';

interface HeaderProps {
  user: User | null;
  siteName: string;
  siteLogo: string;
  currentRoom: Room | null;
  onOpenMenu: () => void;
  onOpenAdmin: () => void;
  onLeaveRoom?: () => void;
  unreadInvitesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  siteName,
  siteLogo,
  currentRoom,
  onOpenMenu,
  onOpenAdmin,
  onLeaveRoom,
  unreadInvitesCount = 0
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-purple-500/20 px-4 py-3 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* LEFT: 3-Dot Menu Button with Unread Badge */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={onOpenMenu}
              className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-white border border-purple-500/30 transition shadow-lg shadow-purple-950/40 active:scale-95 cursor-pointer flex items-center justify-center"
              title="মেনু এবং প্রোফাইল খুলুন"
              aria-label="Open Profile Menu"
            >
              <Menu className="w-5 h-5" />
              {unreadInvitesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-bounce shadow">
                  {unreadInvitesCount}
                </span>
              )}
            </button>
          )}

          {/* If in room: room indicator */}
          {currentRoom && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-slate-200">রুম: #{currentRoom.roomId}</span>
              <span className="text-[11px] text-purple-300 font-mono">({currentRoom.memberCount} জন)</span>
              {onLeaveRoom && (
                <button
                  onClick={onLeaveRoom}
                  className="ml-2 text-[10px] text-red-400 hover:text-red-300 underline font-medium cursor-pointer"
                >
                  ত্যাগ করুন
                </button>
              )}
            </div>
          )}
        </div>

        {/* CENTER: Bass Party Brand Name & Audio Equalizer */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            {/* Animated Bass Equalizer Bars */}
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce"></span>
              <span className="w-1 h-4 bg-pink-500 rounded-full animate-pulse"></span>
              <span className="w-1 h-2.5 bg-cyan-400 rounded-full animate-bounce"></span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 drop-shadow">
              {siteName || 'Bass Party'}
            </h1>

            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 h-2.5 bg-cyan-400 rounded-full animate-bounce"></span>
              <span className="w-1 h-4 bg-pink-500 rounded-full animate-pulse"></span>
              <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce"></span>
            </div>
          </div>
          <span className="text-[10px] tracking-wider uppercase text-purple-400/80 font-mono">
            bassparty.free.nf
          </span>
        </div>

        {/* RIGHT: Website Logo / Profile / Admin Trigger */}
        <div className="flex items-center gap-2.5">
          {user?.isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 text-indigo-200 border border-indigo-500/40 text-xs font-semibold shadow transition active:scale-95 cursor-pointer"
              title="অ্যাডমিন প্যানেল"
            >
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden md:inline">অ্যাডমিন প্যানেল</span>
            </button>
          )}

          {user ? (
            <button
              onClick={onOpenMenu}
              className="flex items-center gap-2 p-1 pl-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-purple-500/30 transition group cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[100px] truncate">
                {user.name}
              </span>
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-purple-400 group-hover:ring-2 ring-purple-500 transition"
              />
            </button>
          ) : (
            <div className="text-xs font-bold text-purple-300 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30">
              {siteLogo || '🔊 Bass Party'}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
