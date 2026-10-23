import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Copy, Check, LogOut, Send, Flame, 
  Sparkles, Radio, Shield, Smile, MessageSquare, Volume2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { YouTubeSyncPlayer } from './YouTubeSyncPlayer';
import { Room, RoomMember, User, ChatMessage, Reaction } from '../types';

interface PartyRoomProps {
  room: Room;
  user: User;
  onLeaveRoom: () => void;
  onHostSync: (action: {
    videoId?: string;
    title?: string;
    isPlaying: boolean;
    currentTime: number;
  }) => void;
  onHeartbeat: (state: { currentTime: number; isPlaying: boolean }) => void;
  onSendReaction: (emoji: string) => void;
  onSendChat: (text: string) => void;
  chatMessages: ChatMessage[];
  floatingReactions: Reaction[];
}

export const PartyRoom: React.FC<PartyRoomProps> = ({
  room,
  user,
  onLeaveRoom,
  onHostSync,
  onHeartbeat,
  onSendReaction,
  onSendChat,
  chatMessages,
  floatingReactions
}) => {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const isHost = room.ownerId === user.userId;

  const handleCopyRoomInfo = () => {
    const text = `🎉 Bass Party রুমে জয়েন করুন!\nরুম আইডি: ${room.roomId}\nপাসওয়ার্ড: ${room.password || '123'}\nলিংক: https://bassparty.free.nf/`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const triggerReaction = (emoji: string) => {
    onSendReaction(emoji);
    if (emoji === '🎉' || emoji === '🔥') {
      try {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      } catch (e) {}
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Floating Animated Party Reactions across screen */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((rec) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: '80vh', x: `${20 + Math.random() * 60}vw`, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: '-10vh', scale: [0.5, 1.8, 1.2], rotate: [-20, 20] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, ease: 'easeOut' }}
              className="absolute text-4xl select-none filter drop-shadow-lg"
            >
              <span>{rec.emoji}</span>
              <span className="block text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-full text-center">
                {rec.senderName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Room Header Banner */}
      <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-4 sm:p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                রুম: <span className="text-pink-400">#{room.roomId}</span>
              </h2>
              {isHost && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  👑 হোস্ট
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>রুম অনার: <strong className="text-slate-200">{room.ownerName}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{room.memberCount || room.members.length} জন উপস্থিত</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Copy credentials & Leave */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyRoomInfo}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="রুম আইডি ও পাসওয়ার্ড কপি করুন"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> কপি সম্পন্ন!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> রুম আইডি কপি করুন
              </>
            )}
          </button>

          <button
            onClick={onLeaveRoom}
            className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-500/40 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> রুম ত্যাগ করুন
          </button>
        </div>
      </div>

      {/* Main Grid: YouTube Player & Party Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: YouTube Synchronized Player */}
        <div className="lg:col-span-2 space-y-6">
          <YouTubeSyncPlayer
            videoId={room.currentVideoId}
            songTitle={room.currentTitle}
            isPlaying={room.isPlaying}
            currentTime={room.currentTime}
            isHost={isHost}
            user={user}
            onHostSync={onHostSync}
            onHeartbeat={onHeartbeat}
          />

          {/* Members Showcase ("সবারই ছবি এবং নিচে তার নাম দেখা যাবে") */}
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                রুমে যুক্ত সদস্যরা ({room.members.length})
              </h3>
              <span className="text-xs text-purple-300">
                {isHost ? 'অ্যাডমিন ভিউ (সবার প্রোফাইল লাইভ)' : 'সবাই একসাথে শুনছেন'}
              </span>
            </div>

            {/* Member Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {room.members.map((member) => (
                <div
                  key={member.userId}
                  className="bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 p-3 rounded-2xl flex flex-col items-center text-center transition group shadow-md"
                >
                  <div className="relative mb-2">
                    <img
                      src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={member.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-purple-500 ring-2 ring-purple-500/30 group-hover:scale-105 transition"
                    />
                    {/* Live playing badge */}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" title="অনলাইন"></span>
                    {member.isAdmin && (
                      <span className="absolute -top-1 -right-1 text-xs" title="রুম এডমিন">👑</span>
                    )}
                  </div>
                  {/* Photo & Name Display as requested */}
                  <div className="font-bold text-xs text-white truncate max-w-[110px]">
                    {member.name}
                  </div>
                  <div className="text-[10px] text-purple-400 font-mono">
                    {member.userId === user.userId ? '(আপনি)' : member.userId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Party Chat & Bass Emoji Reactions */}
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-4 sm:p-5 flex flex-col h-[650px] shadow-2xl backdrop-blur-md">
          {/* Reaction Bar */}
          <div className="pb-3 border-b border-slate-800">
            <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-pink-400">
                <Flame className="w-4 h-4 text-orange-400" /> পার্টি রিঅ্যাকশন দিন!
              </span>
              <span className="text-[10px] text-slate-400">স্ক্রিনে ভাসবে</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {[
                { emoji: '🔥', label: 'Fire' },
                { emoji: '🔊', label: 'Bass' },
                { emoji: '💃', label: 'Dance' },
                { emoji: '🕺', label: 'Groove' },
                { emoji: '🎉', label: 'Party' },
                { emoji: '⚡', label: 'Power' }
              ].map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => triggerReaction(item.emoji)}
                  className="p-2 text-2xl hover:scale-130 active:scale-90 transition rounded-xl hover:bg-slate-800 cursor-pointer"
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Live Chat Messages */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            <div className="text-center py-2">
              <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full">
                🔊 রুমের লাইভ চ্যাট শুরু হয়েছে
              </span>
            </div>

            {chatMessages.map((msg) => {
              const isMine = msg.senderId === user.userId;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                >
                  <img
                    src={msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={msg.senderName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-purple-500/40"
                  />
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${isMine ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none' : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'}`}>
                    <div className="font-bold text-[10px] text-pink-300 mb-0.5">
                      {isMine ? 'আপনি' : msg.senderName}
                    </div>
                    <p className="break-words">{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="রুমে মেসেজ লিখুন..."
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 rounded-xl text-white text-xs font-bold transition flex items-center justify-center cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
