import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ArrowRight, X } from 'lucide-react';
import { RoomInvite } from '../types';

interface InviteToastProps {
  invite: RoomInvite | null;
  onJoin: (invite: RoomInvite) => void;
  onDismiss: () => void;
}

export const InviteToast: React.FC<InviteToastProps> = ({ invite, onJoin, onDismiss }) => {
  if (!invite) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed top-20 right-4 z-50 max-w-sm w-full bg-slate-900 border-2 border-pink-500 rounded-2xl p-4 shadow-2xl shadow-pink-950/60 backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white shrink-0 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-pink-400 uppercase tracking-wide">
                নতুন রুম ইনভাইটেশন!
              </div>
              <div className="text-sm font-extrabold text-white">
                {invite.fromUserName} আপনাকে ইনভাইট করেছেন!
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                রুম: <span className="font-mono font-bold text-purple-300">#{invite.roomId}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onJoin(invite)}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Join Now (রুমে যান)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            পরে
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
