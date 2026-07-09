import { create } from 'zustand';
import { Group, Category, Channel, GroupMember } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, addDoc, setDoc, serverTimestamp } from '../lib/firebase';
import { generateId } from '../lib/utils';

interface GroupState {
  groups: Group[];
  activeGroupMembers: Record<string, GroupMember>; // userId -> member
  categories: Category[];
  channels: Channel[];
  loading: boolean;
  
  fetchGroups: () => void;
  loadGroupData: (groupId: string) => void;
  createGroup: (name: string, description?: string) => Promise<string | null>;
  createChannel: (groupId: string, name: string, type: 'text' | 'voice', categoryId?: string) => Promise<string | null>;
  inviteUserToGroup: (groupId: string, username: string) => Promise<{ success: boolean; message: string }>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroupMembers: {},
  categories: [],
  channels: [],
  loading: true,
  
  fetchGroups: () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    // In a production app, we'd query group_members for the user's groups.
    // For this preview, fetching all groups works with the current rules.
    const q = query(collection(db, 'groups'));
    onSnapshot(q, (snapshot) => {
      const groups: Group[] = [];
      snapshot.forEach(doc => {
        groups.push({ id: doc.id, ...doc.data() } as Group);
      });
      set({ groups, loading: false });
    });
  },
  
  loadGroupData: (groupId: string) => {
    // Categories
    const catQ = query(collection(db, 'groups', groupId, 'categories'));
    onSnapshot(catQ, (snapshot) => {
      const categories: Category[] = [];
      snapshot.forEach(doc => categories.push({ id: doc.id, ...doc.data() } as Category));
      set({ categories: categories.sort((a,b) => a.order - b.order) });
    });
    
    // Channels
    const chanQ = query(collection(db, 'groups', groupId, 'channels'));
    onSnapshot(chanQ, (snapshot) => {
      const channels: Channel[] = [];
      snapshot.forEach(doc => channels.push({ id: doc.id, ...doc.data() } as Channel));
      set({ channels: channels.sort((a,b) => a.order - b.order) });
    });
    
    // Members
    const memQ = query(collection(db, 'groups', groupId, 'members'));
    onSnapshot(memQ, (snapshot) => {
      const members: Record<string, GroupMember> = {};
      snapshot.forEach(doc => {
        const m = doc.data() as GroupMember;
        members[m.userId] = { id: doc.id, ...m };
      });
      set({ activeGroupMembers: members });
    });
  },
  
  createGroup: async (name: string, description = '') => {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    
    try {
      const groupRef = await addDoc(collection(db, 'groups'), {
        name,
        description,
        avatar: '',
        banner: '',
        ownerId: uid,
        inviteCode: generateId(8),
        createdAt: Date.now()
      });
      
      // Add user as owner
      await setDoc(doc(db, 'groups', groupRef.id, 'members', uid), {
        groupId: groupRef.id,
        userId: uid,
        role: 'owner',
        joinedAt: Date.now()
      });
      
      // Create default general channel
      await addDoc(collection(db, 'groups', groupRef.id, 'channels'), {
        groupId: groupRef.id,
        categoryId: null,
        name: 'general',
        type: 'text',
        order: 0,
        createdAt: Date.now()
      });
      
      return groupRef.id;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  
  createChannel: async (groupId: string, name: string, type: 'text' | 'voice', categoryId: string | null = null) => {
    try {
      const chanRef = await addDoc(collection(db, 'groups', groupId, 'channels'), {
        groupId,
        categoryId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type,
        order: get().channels.length,
        createdAt: Date.now()
      });
      return chanRef.id;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  inviteUserToGroup: async (groupId: string, username: string) => {
    try {
      // Find user by username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: false, message: 'User not found.' };
      }
      
      const targetUser = snapshot.docs[0];
      const targetUserId = targetUser.id;
      
      // Check if already in group
      const memberDoc = await getDoc(doc(db, 'groups', groupId, 'members', targetUserId));
      if (memberDoc.exists()) {
        return { success: false, message: 'User is already in this server.' };
      }
      
      // Add to group
      await setDoc(doc(db, 'groups', groupId, 'members', targetUserId), {
        groupId,
        userId: targetUserId,
        role: 'member',
        joinedAt: Date.now()
      });
      
      return { success: true, message: `Successfully added ${username} to the server.` };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Failed to add user.' };
    }
  }
}));
