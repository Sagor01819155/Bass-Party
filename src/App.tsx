import React, { useState, useEffect, useRef } from 'react';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { ProfileDrawer } from './components/ProfileDrawer';
import { RoomLobby } from './components/RoomLobby';
import { PartyRoom } from './components/PartyRoom';
import { AdminPanel } from './components/AdminPanel';
import { InviteToast } from './components/InviteToast';
import { User, Room, SiteSettings, ChatMessage, Reaction, RoomInvite } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('bass_party_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'Bass Party',
    siteLogo: '🔊 Bass Party',
    siteUrl: 'https://bassparty.free.nf',
    accentColor: '#a855f7',
    announcement: '🎉 Welcome to Bass Party! বন্ধুদের সাথে একই সাথে গান শুনুন।',
    emailjsServiceId: 'service_bassparty',
    emailjsTemplateId: 'template_verification',
    emailjsPublicKey: 'pk_bass_default'
  });

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState<RoomInvite | null>(null);
  const [unreadInvitesCount, setUnreadInvitesCount] = useState(0);

  // Room Chat and Floating Reactions
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<Reaction[]>([]);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Load Site Settings
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSiteSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Active Rooms
  const fetchActiveRooms = async () => {
    try {
      const res = await fetch('/api/rooms/active');
      const data = await res.json();
      if (data.success) {
        setActiveRooms(data.rooms || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 8000);
    return () => clearInterval(interval);
  }, []);

  // Connect WebSocket
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const connectWs = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Identify client
        ws.send(JSON.stringify({ type: 'identify', userId: user.userId }));

        // Rejoin room if currently active
        if (currentRoom) {
          ws.send(JSON.stringify({
            type: 'join_room',
            roomId: currentRoom.roomId,
            user
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'room_state': {
              setCurrentRoom((prev) => ({
                ...(prev || {}),
                ...msg.room
              }));
              break;
            }

            case 'member_joined': {
              setCurrentRoom((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  members: msg.members,
                  memberCount: msg.memberCount
                };
              });
              break;
            }

            case 'member_left': {
              setCurrentRoom((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  members: msg.members,
                  memberCount: msg.memberCount
                };
              });
              break;
            }

            case 'playback_update': {
              setCurrentRoom((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  currentVideoId: msg.videoId,
                  currentTitle: msg.title || prev.currentTitle,
                  isPlaying: msg.isPlaying,
                  currentTime: msg.currentTime
                };
              });
              break;
            }

            case 'heartbeat_tick': {
              // Micro sync adjustment without disrupting smooth playback
              setCurrentRoom((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  currentTime: msg.currentTime,
                  isPlaying: msg.isPlaying
                };
              });
              break;
            }

            case 'reaction': {
              setFloatingReactions((prev) => [
                ...prev,
                { id: msg.id, emoji: msg.emoji, senderName: msg.senderName }
              ]);
              setTimeout(() => {
                setFloatingReactions((prev) => prev.filter((r) => r.id !== msg.id));
              }, 3500);
              break;
            }

            case 'chat': {
              setChatMessages((prev) => [...prev, msg]);
              break;
            }

            case 'room_invite': {
              setIncomingInvite(msg.invite);
              setUnreadInvitesCount((c) => c + 1);
              break;
            }

            case 'room_closed': {
              alert(msg.message || 'রুম বন্ধ করা হয়েছে');
              setCurrentRoom(null);
              break;
            }
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
      };
    };

    connectWs();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [user]);

  // Auth Handlers
  const handleAuthSuccess = (authedUser: User) => {
    setUser(authedUser);
    localStorage.setItem('bass_party_user', JSON.stringify(authedUser));
  };

  const handleLogout = () => {
    if (wsRef.current && currentRoom) {
      wsRef.current.send(JSON.stringify({
        type: 'leave_room',
        roomId: currentRoom.roomId,
        userId: user?.userId
      }));
    }
    setUser(null);
    setCurrentRoom(null);
    localStorage.removeItem('bass_party_user');
  };

  // Update profile handler
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('bass_party_user', JSON.stringify(updatedUser));
  };

  // Create Room
  const handleCreateRoom = async (roomId: string, pass: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, password: pass, owner: user })
      });
      const data = await res.json();
      if (data.success) {
        const newRoom = { ...data.room, password: pass };
        setCurrentRoom(newRoom);
        setChatMessages([]);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'join_room',
            roomId: newRoom.roomId,
            user
          }));
        }
        fetchActiveRooms();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Join Room
  const handleJoinRoom = async (roomId: string, pass: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, password: pass, user })
      });
      const data = await res.json();
      if (data.success) {
        const joinedRoom = { ...data.room, password: pass };
        setCurrentRoom(joinedRoom);
        setChatMessages([]);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'join_room',
            roomId: joinedRoom.roomId,
            user
          }));
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Leave Room
  const handleLeaveRoom = () => {
    if (wsRef.current && currentRoom) {
      wsRef.current.send(JSON.stringify({
        type: 'leave_room',
        roomId: currentRoom.roomId,
        userId: user?.userId
      }));
    }
    setCurrentRoom(null);
    setChatMessages([]);
    fetchActiveRooms();
  };

  // Host Synchronizes Playback Action
  const handleHostSync = (action: {
    videoId?: string;
    title?: string;
    isPlaying: boolean;
    currentTime: number;
  }) => {
    if (!currentRoom || !user) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'sync_playback',
        roomId: currentRoom.roomId,
        senderId: user.userId,
        senderName: user.name,
        videoId: action.videoId || currentRoom.currentVideoId,
        title: action.title || currentRoom.currentTitle,
        isPlaying: action.isPlaying,
        currentTime: action.currentTime
      }));
    }
  };

  // Host Periodic Heartbeat
  const handleHeartbeat = (state: { currentTime: number; isPlaying: boolean }) => {
    if (!currentRoom || !user || currentRoom.ownerId !== user.userId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'heartbeat',
        roomId: currentRoom.roomId,
        senderId: user.userId,
        currentTime: state.currentTime,
        isPlaying: state.isPlaying
      }));
    }
  };

  // Send Reaction
  const handleSendReaction = (emoji: string) => {
    if (!currentRoom || !user) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reaction',
        roomId: currentRoom.roomId,
        emoji,
        senderName: user.name
      }));
    }
  };

  // Send Chat
  const handleSendChat = (text: string) => {
    if (!currentRoom || !user) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        roomId: currentRoom.roomId,
        text,
        senderName: user.name,
        senderAvatar: user.avatar,
        senderId: user.userId
      }));
    }
  };

  // Join Directly from Inbound Invite
  const handleJoinFromInvite = (invite: RoomInvite) => {
    setIncomingInvite(null);
    handleJoinRoom(invite.roomId, invite.roomPassword);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* 1. Unauthenticated View: 10 Animated Cartoon Boombox Squad & Login/Signup */}
      {!user ? (
        <AuthModal
          onSuccess={handleAuthSuccess}
          siteName={siteSettings.siteName}
        />
      ) : (
        /* 2. Authenticated App Layout */
        <>
          {/* Top Header */}
          <Header
            user={user}
            siteName={siteSettings.siteName}
            siteLogo={siteSettings.siteLogo}
            currentRoom={currentRoom}
            onOpenMenu={() => setIsMenuOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onLeaveRoom={handleLeaveRoom}
            unreadInvitesCount={unreadInvitesCount}
          />

          {/* Left Slide-over Profile Drawer (Hidden by default, triggered by 3-dot) */}
          <ProfileDrawer
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            user={user}
            currentRoom={currentRoom}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
            onJoinFromInvite={handleJoinFromInvite}
          />

          {/* Real-time Inbound Invite Toast */}
          <InviteToast
            invite={incomingInvite}
            onJoin={handleJoinFromInvite}
            onDismiss={() => setIncomingInvite(null)}
          />

          {/* Admin Panel Modal */}
          <AdminPanel
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            currentUser={user}
            settings={siteSettings}
            onUpdateSettings={(updated) => setSiteSettings((prev) => ({ ...prev, ...updated }))}
          />

          {/* Announcement banner if set */}
          {siteSettings.announcement && (
            <div className="bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-slate-900 border-b border-purple-500/20 py-2 px-4 text-center text-xs text-purple-200">
              {siteSettings.announcement}
            </div>
          )}

          {/* Main Content: Either Inside Party Room or Room Lobby */}
          <main className="flex-1">
            {currentRoom ? (
              <PartyRoom
                room={currentRoom}
                user={user}
                onLeaveRoom={handleLeaveRoom}
                onHostSync={handleHostSync}
                onHeartbeat={handleHeartbeat}
                onSendReaction={handleSendReaction}
                onSendChat={handleSendChat}
                chatMessages={chatMessages}
                floatingReactions={floatingReactions}
              />
            ) : (
              <RoomLobby
                user={user}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                activeRooms={activeRooms}
                onRefreshRooms={fetchActiveRooms}
                siteName={siteSettings.siteName}
              />
            )}
          </main>

          {/* Modern Footer with Bass Party branding and SEO details */}
          <footer className="border-t border-purple-500/20 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">
              © {new Date().getFullYear()} {siteSettings.siteName} (bassparty.free.nf) – রিয়েল-টাইম সিনক্রোনাইজড মিউজিক পার্টি
            </p>
            <p className="text-[11px] text-slate-600">
              YouTube IFrame API & WebSocket ইঞ্জিন দ্বারা চালিত • MySQL Database Ready (install.php)
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
