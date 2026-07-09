export type User = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  lastSeen: number;
  createdAt: number;
  banner?: string;
  bio?: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  avatar: string;
  banner: string;
  ownerId: string;
  inviteCode: string;
  createdAt: number;
};

export type GroupMember = {
  id: string; // group_user
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
};

export type Category = {
  id: string;
  groupId: string;
  name: string;
  order: number;
  createdAt: number;
};

export type Channel = {
  id: string;
  groupId: string;
  categoryId: string | null;
  name: string;
  type: 'text' | 'voice';
  order: number;
  createdAt: number;
};

export type Message = {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file' | 'system';
  fileUrl?: string;
  createdAt: number;
  editedAt?: number;
  replyTo?: string;
  reactions?: Record<string, string[]>; // emoji: userIds
};

export type DirectMessage = {
  id: string; // uid1_uid2
  participants: string[];
  createdAt: number;
  lastMessageAt: number;
};

export type FriendRequest = {
  id: string; // sender_receiver
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
};

export type Friendship = {
  id: string; // uid1_uid2
  user1Id: string;
  user2Id: string;
  createdAt: number;
};
