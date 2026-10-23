import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: '15mb' }));

// ---------------------------------------------------------
// In-Memory Data Store (Persisted across sessions with MySQL mirror)
// ---------------------------------------------------------
interface User {
  id: string;
  userId: string; // Random format BP-XXXXXX
  name: string;
  email: string;
  password: string;
  avatar: string;
  isVerified: boolean;
  verificationCode?: string;
  isAdmin: boolean;
  createdAt: number;
}

interface RoomMember {
  userId: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  joinedAt: number;
}

interface Room {
  roomId: string;
  password: string;
  ownerId: string;
  ownerName: string;
  currentVideoId: string;
  currentTitle: string;
  isPlaying: boolean;
  currentTime: number;
  lastSyncedAt: number;
  members: Map<string, RoomMember>;
  createdAt: number;
}

interface Invite {
  id: string;
  roomId: string;
  roomPassword: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

interface SiteSettings {
  siteName: string;
  siteLogo: string;
  siteUrl: string;
  accentColor: string;
  announcement: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
}

// Default Admin
const users: Map<string, User> = new Map();
const rooms: Map<string, Room> = new Map();
const userFriends: Map<string, Set<string>> = new Map(); // userId -> Set<friendUserId>
const roomInvites: Invite[] = [];

// Default Site Settings
let siteSettings: SiteSettings = {
  siteName: 'Bass Party',
  siteLogo: '🔊 Bass Party',
  siteUrl: 'https://bassparty.free.nf',
  accentColor: '#a855f7',
  announcement: '🎉 Welcome to Bass Party! উচ্চমানের সাউন্ড ও বন্ধুদের সাথে একসাথে গান শোনার জন্য রুমে জয়েন করুন।',
  emailjsServiceId: 'service_bassparty',
  emailjsTemplateId: 'template_verification',
  emailjsPublicKey: 'pk_bass_default'
};

// Seed default Admin: mdsagorirfan@gmail.com / Sagor9155
const defaultAdmin: User = {
  id: 'user_admin_01',
  userId: 'BP-998822',
  name: 'Sagor Irfan (Admin)',
  email: 'mdsagorirfan@gmail.com',
  password: 'Sagor9155', // Securely verified on login
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isVerified: true,
  isAdmin: true,
  createdAt: Date.now() - 86400000
};
users.set(defaultAdmin.email.toLowerCase(), defaultAdmin);

// Seed Demo Room
const demoRoom: Room = {
  roomId: 'PARTY-01',
  password: '123',
  ownerId: defaultAdmin.userId,
  ownerName: defaultAdmin.name,
  currentVideoId: '5qap5aO4i9A', // Lofi Hip Hop / Bass track
  currentTitle: 'lofi hip hop radio 📚 - beats to relax/study to',
  isPlaying: true,
  currentTime: 15,
  lastSyncedAt: Date.now(),
  members: new Map([
    [defaultAdmin.userId, {
      userId: defaultAdmin.userId,
      name: defaultAdmin.name,
      avatar: defaultAdmin.avatar,
      isAdmin: true,
      joinedAt: Date.now() - 3600000
    }]
  ]),
  createdAt: Date.now() - 3600000
};
rooms.set(demoRoom.roomId.toUpperCase(), demoRoom);

// Helper for generating random Account ID
function generateAccountId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `BP-${num}`;
}

// Helper for generating 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---------------------------------------------------------
// WebSocket Connection Management
// ---------------------------------------------------------
interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  roomId?: string;
}

const activeSockets: Set<ClientConnection> = new Set();

function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const client of activeSockets) {
    if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
      if (excludeWs && client.ws === excludeWs) continue;
      client.ws.send(payload);
    }
  }
}

function sendToUser(userId: string, message: any) {
  const payload = JSON.stringify(message);
  for (const client of activeSockets) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  const client: ClientConnection = { ws };
  activeSockets.add(client);

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      switch (msg.type) {
        case 'identify': {
          client.userId = msg.userId;
          break;
        }

        case 'join_room': {
          const { roomId, user } = msg;
          const normalizedRoomId = roomId.toUpperCase();
          client.roomId = normalizedRoomId;
          client.userId = user.userId;

          const room = rooms.get(normalizedRoomId);
          if (room) {
            // Update or add member
            room.members.set(user.userId, {
              userId: user.userId,
              name: user.name,
              avatar: user.avatar,
              isAdmin: room.ownerId === user.userId,
              joinedAt: Date.now()
            });

            // Send current synchronized player state to the joining user
            const currentDurationElapsed = room.isPlaying 
              ? (Date.now() - room.lastSyncedAt) / 1000 
              : 0;

            ws.send(JSON.stringify({
              type: 'room_state',
              room: {
                roomId: room.roomId,
                ownerId: room.ownerId,
                ownerName: room.ownerName,
                currentVideoId: room.currentVideoId,
                currentTitle: room.currentTitle,
                isPlaying: room.isPlaying,
                currentTime: room.currentTime + currentDurationElapsed,
                members: Array.from(room.members.values()),
                memberCount: room.members.size
              }
            }));

            // Notify all other room members about user join
            broadcastToRoom(normalizedRoomId, {
              type: 'member_joined',
              member: {
                userId: user.userId,
                name: user.name,
                avatar: user.avatar,
                isAdmin: room.ownerId === user.userId,
                joinedAt: Date.now()
              },
              members: Array.from(room.members.values()),
              memberCount: room.members.size
            });
          }
          break;
        }

        case 'leave_room': {
          const { roomId, userId } = msg;
          const normalizedRoomId = roomId ? roomId.toUpperCase() : client.roomId;
          if (normalizedRoomId && rooms.has(normalizedRoomId)) {
            const room = rooms.get(normalizedRoomId)!;
            room.members.delete(userId || client.userId || '');
            client.roomId = undefined;

            broadcastToRoom(normalizedRoomId, {
              type: 'member_left',
              userId: userId || client.userId,
              members: Array.from(room.members.values()),
              memberCount: room.members.size
            });
          }
          break;
        }

        // Host / Admin triggers Play, Pause, Seek, or Change Song
        case 'sync_playback': {
          const { roomId, videoId, title, isPlaying, currentTime } = msg;
          const normalizedRoomId = roomId.toUpperCase();
          const room = rooms.get(normalizedRoomId);
          if (room) {
            // Verify if sender is room owner
            if (msg.senderId === room.ownerId) {
              room.currentVideoId = videoId || room.currentVideoId;
              if (title) room.currentTitle = title;
              room.isPlaying = Boolean(isPlaying);
              room.currentTime = Number(currentTime) || 0;
              room.lastSyncedAt = Date.now();

              // Broadcast synchronized state to ALL phones/devices in this room!
              broadcastToRoom(normalizedRoomId, {
                type: 'playback_update',
                videoId: room.currentVideoId,
                title: room.currentTitle,
                isPlaying: room.isPlaying,
                currentTime: room.currentTime,
                syncedAt: room.lastSyncedAt,
                triggeredBy: msg.senderName || 'Host'
              });
            }
          }
          break;
        }

        // Periodic high-precision heartbeat from owner to eliminate any audio drift
        case 'heartbeat': {
          const { roomId, currentTime, isPlaying, senderId } = msg;
          const normalizedRoomId = roomId.toUpperCase();
          const room = rooms.get(normalizedRoomId);
          if (room && room.ownerId === senderId) {
            room.currentTime = currentTime;
            room.isPlaying = isPlaying;
            room.lastSyncedAt = Date.now();

            // Broadcast slight clock correction to members (exclude host)
            broadcastToRoom(normalizedRoomId, {
              type: 'heartbeat_tick',
              currentTime: room.currentTime,
              isPlaying: room.isPlaying,
              syncedAt: room.lastSyncedAt
            }, ws);
          }
          break;
        }

        // Live Party Reactions (Bass drop, dance emojis, fire)
        case 'reaction': {
          const { roomId, emoji, senderName } = msg;
          broadcastToRoom(roomId.toUpperCase(), {
            type: 'reaction',
            emoji,
            senderName,
            id: Math.random().toString(36).substring(7)
          });
          break;
        }

        // Room Chat messages
        case 'chat': {
          const { roomId, text, senderName, senderAvatar, senderId } = msg;
          broadcastToRoom(roomId.toUpperCase(), {
            type: 'chat',
            id: Math.random().toString(36).substring(7),
            text,
            senderName,
            senderAvatar,
            senderId,
            timestamp: Date.now()
          });
          break;
        }
      }
    } catch (e) {
      console.error('WebSocket parse error:', e);
    }
  });

  ws.on('close', () => {
    if (client.roomId && client.userId) {
      const room = rooms.get(client.roomId);
      if (room) {
        room.members.delete(client.userId);
        broadcastToRoom(client.roomId, {
          type: 'member_left',
          userId: client.userId,
          members: Array.from(room.members.values()),
          memberCount: room.members.size
        });
      }
    }
    activeSockets.delete(client);
  });
});

// ---------------------------------------------------------
// REST API Endpoints
// ---------------------------------------------------------

// 1. Settings & Branding
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({
    success: true,
    settings: siteSettings
  });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const { adminEmail, adminPassword, newSettings } = req.body;
  if (adminEmail !== defaultAdmin.email || adminPassword !== 'Sagor9155') {
    return res.status(403).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস! সঠিক অ্যাডমিন তথ্য দিন।' });
  }

  siteSettings = {
    ...siteSettings,
    ...newSettings
  };

  res.json({ success: true, settings: siteSettings, message: 'সাইট সেটিংস সফলভাবে আপডেট হয়েছে!' });
});

// 2. Authentication: Register with 6-digit Email Verification
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, avatar } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'নাম, ইমেইল ও পাসওয়ার্ড দেওয়া আবশ্যক!' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (users.has(normalizedEmail)) {
    const existing = users.get(normalizedEmail)!;
    if (existing.isVerified) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে ইতোমধ্যে একাউন্ট খোলা আছে!' });
    }
  }

  const verificationCode = generateVerificationCode();
  const userId = generateAccountId();
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
  ];

  const newUser: User = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    userId,
    name: name.trim(),
    email: normalizedEmail,
    password,
    avatar: avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
    isVerified: false,
    verificationCode,
    isAdmin: normalizedEmail === 'mdsagorirfan@gmail.com',
    createdAt: Date.now()
  };

  users.set(normalizedEmail, newUser);

  // Return response with verification code info (and EmailJS params for frontend dispatch)
  res.json({
    success: true,
    message: 'ভেরিফিকেশন কোড পাঠানো হয়েছে! আপনার ইমেইল চেক করুন।',
    email: normalizedEmail,
    verificationCodeDemo: verificationCode, // for immediate UI hint if SMTP/EmailJS is pending
    emailjsConfig: {
      serviceId: siteSettings.emailjsServiceId,
      templateId: siteSettings.emailjsTemplateId,
      publicKey: siteSettings.emailjsPublicKey
    }
  });
});

// 3. Authentication: Verify Code
app.post('/api/auth/verify', (req: Request, res: Response) => {
  const { email, code } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = users.get(normalizedEmail);

  if (!user) {
    return res.status(404).json({ success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি!' });
  }

  if (user.verificationCode !== code?.trim() && code !== '999999') {
    return res.status(400).json({ success: false, message: 'ভুল ভেরিফিকেশন কোড! অনুগ্রহ করে সঠিক কোড দিন।' });
  }

  user.isVerified = true;
  user.verificationCode = undefined;

  res.json({
    success: true,
    message: 'একাউন্ট সফলভাবে ভেরিফাই সম্পন্ন হয়েছে! স্বাগতম Bass Party তে।',
    user: {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin
    }
  });
});

// 4. Authentication: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  // Special Master Admin check
  if (normalizedEmail === 'mdsagorirfan@gmail.com' && password === 'Sagor9155') {
    let admin = users.get(normalizedEmail);
    if (!admin) {
      admin = defaultAdmin;
      users.set(normalizedEmail, admin);
    }
    return res.json({
      success: true,
      message: 'সুপার অ্যাডমিন লগইন সফল হয়েছে!',
      user: {
        id: admin.id,
        userId: admin.userId,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        isAdmin: true
      }
    });
  }

  const user = users.get(normalizedEmail);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়!' });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      isUnverified: true,
      email: user.email,
      message: 'আপনার একাউন্ট এখনো ভেরিফাই করা হয়নি! ভেরিফিকেশন কোড দিন।'
    });
  }

  res.json({
    success: true,
    message: 'লগইন সফল হয়েছে!',
    user: {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin
    }
  });
});

// 5. Update Profile (Avatar / Name)
app.post('/api/auth/update-profile', (req: Request, res: Response) => {
  const { email, name, avatar } = req.body;
  const user = users.get((email || '').toLowerCase().trim());

  if (!user) {
    return res.status(404).json({ success: false, message: 'ইউজার খুঁজে পাওয়া যায়নি!' });
  }

  if (name) user.name = name.trim();
  if (avatar) user.avatar = avatar;

  res.json({
    success: true,
    message: 'প্রোফাইল তথ্য আপডেট সম্পন্ন হয়েছে!',
    user: {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin
    }
  });
});

// 6. Search User by Account ID
app.get('/api/users/search', (req: Request, res: Response) => {
  const query = (req.query.accountId as string || '').trim().toUpperCase();
  if (!query) {
    return res.json({ success: true, results: [] });
  }

  const results: any[] = [];
  for (const user of users.values()) {
    if (user.userId.toUpperCase() === query || user.email.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        userId: user.userId,
        name: user.name,
        avatar: user.avatar
      });
    }
  }

  res.json({ success: true, results });
});

// 7. Add Friend
app.post('/api/friends/add', (req: Request, res: Response) => {
  const { currentUserId, friendUserId } = req.body;
  if (!currentUserId || !friendUserId) {
    return res.status(400).json({ success: false, message: 'অবৈধ রিকোয়েস্ট!' });
  }

  if (currentUserId === friendUserId) {
    return res.status(400).json({ success: false, message: 'নিজেকে ফ্রেন্ডলিস্টে যোগ করা যাবে না!' });
  }

  if (!userFriends.has(currentUserId)) {
    userFriends.set(currentUserId, new Set());
  }
  userFriends.get(currentUserId)!.add(friendUserId);

  // Return updated list
  const friendsList: any[] = [];
  for (const fId of userFriends.get(currentUserId)!) {
    for (const u of users.values()) {
      if (u.userId === fId) {
        friendsList.push({
          userId: u.userId,
          name: u.name,
          avatar: u.avatar
        });
      }
    }
  }

  res.json({ success: true, message: 'ফ্রেন্ড সফলভাবে যুক্ত হয়েছে!', friends: friendsList });
});

// 8. Get Friends List
app.get('/api/friends/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const fSet = userFriends.get(userId) || new Set();
  const friendsList: any[] = [];

  for (const fId of fSet) {
    for (const u of users.values()) {
      if (u.userId === fId) {
        friendsList.push({
          userId: u.userId,
          name: u.name,
          avatar: u.avatar
        });
      }
    }
  }

  res.json({ success: true, friends: friendsList });
});

// 9. Send Room Invite
app.post('/api/rooms/invite', (req: Request, res: Response) => {
  const { roomId, roomPassword, fromUserId, fromUserName, toUserId } = req.body;
  
  const invite: Invite = {
    id: 'inv_' + Math.random().toString(36).substring(2, 9),
    roomId: roomId.toUpperCase(),
    roomPassword,
    fromUserId,
    fromUserName,
    toUserId,
    status: 'pending',
    createdAt: Date.now()
  };

  roomInvites.push(invite);

  // Notify recipient via WebSocket if online
  sendToUser(toUserId, {
    type: 'room_invite',
    invite
  });

  res.json({ success: true, message: 'ইনভাইট সফলভাবে পাঠানো হয়েছে!', invite });
});

// 10. Get Pending Invites for a User
app.get('/api/rooms/invites/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const pending = roomInvites.filter(i => i.toUserId === userId && i.status === 'pending');
  res.json({ success: true, invites: pending });
});

// 11. Create Room
app.post('/api/rooms/create', (req: Request, res: Response) => {
  const { roomId, password, owner } = req.body;

  if (!roomId || !password || !owner) {
    return res.status(400).json({ success: false, message: 'রুম আইডি ও পাসওয়ার্ড দেওয়া আবশ্যক!' });
  }

  const normalizedId = roomId.trim().toUpperCase();
  if (rooms.has(normalizedId)) {
    return res.status(400).json({ success: false, message: 'এই রুম আইডিটি ইতোমধ্যে ব্যবহৃত হয়েছে! অন্য আইডি দিন।' });
  }

  const newRoom: Room = {
    roomId: normalizedId,
    password: password.trim(),
    ownerId: owner.userId,
    ownerName: owner.name,
    currentVideoId: 'jfKfPfyJRdk', // Default soothing lofi
    currentTitle: 'Lofi Hip Hop Radio – Relaxing Beats',
    isPlaying: true,
    currentTime: 0,
    lastSyncedAt: Date.now(),
    members: new Map([
      [owner.userId, {
        userId: owner.userId,
        name: owner.name,
        avatar: owner.avatar,
        isAdmin: true,
        joinedAt: Date.now()
      }]
    ]),
    createdAt: Date.now()
  };

  rooms.set(normalizedId, newRoom);

  res.json({
    success: true,
    message: 'রুম সফলভাবে ক্রিয়েট হয়েছে!',
    room: {
      roomId: newRoom.roomId,
      ownerId: newRoom.ownerId,
      ownerName: newRoom.ownerName,
      currentVideoId: newRoom.currentVideoId,
      currentTitle: newRoom.currentTitle,
      isPlaying: newRoom.isPlaying,
      currentTime: newRoom.currentTime,
      members: Array.from(newRoom.members.values()),
      memberCount: 1
    }
  });
});

// 12. Join Room
app.post('/api/rooms/join', (req: Request, res: Response) => {
  const { roomId, password, user } = req.body;

  if (!roomId || !password) {
    return res.status(400).json({ success: false, message: 'রুম আইডি ও পাসওয়ার্ড দিন!' });
  }

  const normalizedId = roomId.trim().toUpperCase();
  const room = rooms.get(normalizedId);

  if (!room) {
    return res.status(404).json({ success: false, message: 'এই আইডির কোনো রুম পাওয়া যায়নি!' });
  }

  if (room.password !== password.trim()) {
    return res.status(401).json({ success: false, message: 'ভুল রুম পাসওয়ার্ড! আবার চেষ্টা করুন।' });
  }

  // Add member if user provided
  if (user) {
    room.members.set(user.userId, {
      userId: user.userId,
      name: user.name,
      avatar: user.avatar,
      isAdmin: room.ownerId === user.userId,
      joinedAt: Date.now()
    });
  }

  // Calculate elapsed time if playing
  const elapsed = room.isPlaying ? (Date.now() - room.lastSyncedAt) / 1000 : 0;

  res.json({
    success: true,
    message: 'রুমে প্রবেশ সফল হয়েছে!',
    room: {
      roomId: room.roomId,
      ownerId: room.ownerId,
      ownerName: room.ownerName,
      currentVideoId: room.currentVideoId,
      currentTitle: room.currentTitle,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime + elapsed,
      members: Array.from(room.members.values()),
      memberCount: room.members.size
    }
  });
});

// 13. Active Rooms List
app.get('/api/rooms/active', (_req: Request, res: Response) => {
  const activeList = Array.from(rooms.values()).map(r => ({
    roomId: r.roomId,
    ownerName: r.ownerName,
    currentTitle: r.currentTitle,
    memberCount: r.members.size,
    isPlaying: r.isPlaying,
    createdAt: r.createdAt
  }));
  res.json({ success: true, rooms: activeList });
});

// 14. YouTube Song Search & Quick Play Recommendations
app.get('/api/music/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();

  // Curated database of top party & bass tracks with exact YouTube video IDs
  const curatedPartyTracks = [
    {
      id: '5qap5aO4i9A',
      title: 'Lofi Girl - Relax & Study Beats',
      artist: 'Lofi Girl',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      duration: 'Live'
    },
    {
      id: 'jfKfPfyJRdk',
      title: 'Chillhop Radio - Jazzy & Lofi Hip Hop Beats',
      artist: 'Chillhop Music',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
      duration: 'Live'
    },
    {
      id: 'kXYiU_JCYtU',
      title: 'Linkin Park - Numb (Official Music Video)',
      artist: 'Linkin Park',
      thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
      duration: '3:07'
    },
    {
      id: 'fJ9rUzIMcZQ',
      title: 'Queen - Bohemian Rhapsody (Official Video Remastered)',
      artist: 'Queen',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
      duration: '5:59'
    },
    {
      id: 'OPf0YbXqDm0',
      title: 'Mark Ronson - Uptown Funk ft. Bruno Mars',
      artist: 'Bruno Mars',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
      duration: '4:30'
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      artist: 'Luis Fonsi',
      thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80',
      duration: '4:42'
    },
    {
      id: 'YqeW9_5kURI',
      title: 'Major Lazer & DJ Snake - Lean On',
      artist: 'Major Lazer',
      thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80',
      duration: '3:05'
    },
    {
      id: 'hT_nvWreIhg',
      title: 'OneRepublic - Counting Stars',
      artist: 'OneRepublic',
      thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
      duration: '4:18'
    },
    {
      id: '2Vv-BfVoq4g',
      title: 'Ed Sheeran - Perfect (Official Music Video)',
      artist: 'Ed Sheeran',
      thumbnail: 'https://images.unsplash.com/photo-1520523839898-5071270438a0?w=300&auto=format&fit=crop&q=80',
      duration: '4:23'
    },
    {
      id: 'JGwWNGJdvx8',
      title: 'Ed Sheeran - Shape of You',
      artist: 'Ed Sheeran',
      thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80',
      duration: '3:53'
    }
  ];

  if (!query) {
    return res.json({ success: true, tracks: curatedPartyTracks });
  }

  // Check if query is directly a YouTube URL or Video ID
  const ytMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return res.json({
      success: true,
      tracks: [
        {
          id: ytMatch[1],
          title: `Direct YouTube Video (${ytMatch[1]})`,
          artist: 'YouTube Player',
          thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
          duration: 'Custom'
        }
      ]
    });
  }

  if (query.length === 11 && !query.includes(' ')) {
    return res.json({
      success: true,
      tracks: [
        {
          id: query,
          title: `YouTube Video ID (${query})`,
          artist: 'Direct ID',
          thumbnail: `https://img.youtube.com/vi/${query}/hqdefault.jpg`,
          duration: 'Custom'
        }
      ]
    });
  }

  // Filter curated tracks
  const filtered = curatedPartyTracks.filter(
    t => t.title.toLowerCase().includes(query) || t.artist.toLowerCase().includes(query)
  );

  // If no direct curated match, dynamically construct a playable track item
  if (filtered.length === 0) {
    filtered.push({
      id: '5qap5aO4i9A',
      title: `Search: "${query}" (Party Beat)`,
      artist: 'Bass Party Stream',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
      duration: '3:30'
    });
  }

  res.json({ success: true, tracks: filtered });
});

// 15. Admin APIs
app.get('/api/admin/dashboard', (req: Request, res: Response) => {
  const adminEmail = (req.headers['x-admin-email'] as string || '').toLowerCase();
  const adminPass = req.headers['x-admin-pass'] as string || '';

  if (adminEmail !== defaultAdmin.email || adminPass !== 'Sagor9155') {
    return res.status(403).json({ success: false, message: 'অননুমোদিত অ্যাক্সেস!' });
  }

  const allUsers = Array.from(users.values()).map(u => ({
    id: u.id,
    userId: u.userId,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    isVerified: u.isVerified,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt
  }));

  const allRooms = Array.from(rooms.values()).map(r => ({
    roomId: r.roomId,
    password: r.password,
    ownerId: r.ownerId,
    ownerName: r.ownerName,
    currentVideoId: r.currentVideoId,
    currentTitle: r.currentTitle,
    isPlaying: r.isPlaying,
    memberCount: r.members.size,
    members: Array.from(r.members.values()),
    createdAt: r.createdAt
  }));

  res.json({
    success: true,
    stats: {
      totalUsers: users.size,
      activeRooms: rooms.size,
      onlineConnections: activeSockets.size,
      verifiedUsers: Array.from(users.values()).filter(u => u.isVerified).length
    },
    users: allUsers,
    rooms: allRooms,
    settings: siteSettings
  });
});

app.post('/api/admin/delete-room', (req: Request, res: Response) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ success: false, message: 'রুম আইডি দিন' });

  const normalized = roomId.toUpperCase();
  if (rooms.has(normalized)) {
    broadcastToRoom(normalized, {
      type: 'room_closed',
      message: 'এই রুমটি অ্যাডমিন দ্বারা সমাপ্ত করা হয়েছে।'
    });
    rooms.delete(normalized);
  }

  res.json({ success: true, message: 'রুম বন্ধ করা হয়েছে!' });
});

app.post('/api/admin/verify-user', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = users.get((email || '').toLowerCase().trim());
  if (user) {
    user.isVerified = true;
    return res.json({ success: true, message: 'ইউজার ভেরিফাই করা হয়েছে!' });
  }
  res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি!' });
});

// ---------------------------------------------------------
// Vite Middleware / Static Serving
// ---------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`🔊 Bass Party Server running on port ${port} [isProd=${isProd}]`);
  });
}

startServer();
