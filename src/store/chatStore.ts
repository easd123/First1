import { create } from 'zustand';
import { Message } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from '../lib/firebase';

interface ChatState {
  messages: Message[];
  loading: boolean;
  channelId: string | null;
  unsub: (() => void) | null;
  
  subscribeToChannel: (channelId: string) => void;
  sendMessage: (content: string, type?: Message['type'], fileUrl?: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  channelId: null,
  unsub: null,
  
  subscribeToChannel: (channelId: string) => {
    const { unsub } = get();
    if (unsub) unsub();
    
    if (!channelId) {
      set({ messages: [], channelId: null, unsub: null });
      return;
    }
    
    set({ loading: true, channelId });
    
    const messagesRef = collection(db, 'channels', channelId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
    
    const newUnsub = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      set({ messages, loading: false });
    });
    
    set({ unsub: newUnsub });
  },
  
  sendMessage: async (content: string, type = 'text', fileUrl?: string) => {
    const { channelId } = get();
    const uid = auth.currentUser?.uid;
    if (!channelId || !uid || !content.trim()) return;
    
    const messagesRef = collection(db, 'channels', channelId, 'messages');
    await addDoc(messagesRef, {
      channelId,
      senderId: uid,
      content,
      type,
      fileUrl: fileUrl || null,
      createdAt: Date.now(), // Use client time for sorting, can use serverTimestamp if needed
    });
  },
  
  deleteMessage: async (messageId: string) => {
    const { channelId } = get();
    if (!channelId) return;
    const msgRef = doc(db, 'channels', channelId, 'messages', messageId);
    await deleteDoc(msgRef);
  },
  
  editMessage: async (messageId: string, content: string) => {
    const { channelId } = get();
    if (!channelId) return;
    const msgRef = doc(db, 'channels', channelId, 'messages', messageId);
    await updateDoc(msgRef, { content, editedAt: Date.now() });
  }
}));
