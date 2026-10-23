export interface User {
  id: string;
  userId: string; // e.g. BP-123456
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  isVerified?: boolean;
}

export interface RoomMember {
  userId: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  joinedAt: number;
}

export interface Room {
  roomId: string;
  password?: string;
  ownerId: string;
  ownerName: string;
  currentVideoId: string;
  currentTitle: string;
  isPlaying: boolean;
  currentTime: number;
  members: RoomMember[];
  memberCount: number;
}

export interface Friend {
  userId: string;
  name: string;
  avatar: string;
}

export interface RoomInvite {
  id: string;
  roomId: string;
  roomPassword: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface SiteSettings {
  siteName: string;
  siteLogo: string;
  siteUrl: string;
  accentColor: string;
  announcement: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderName: string;
  senderAvatar: string;
  senderId: string;
  timestamp: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  senderName: string;
}
