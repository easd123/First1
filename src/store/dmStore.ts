import { create } from 'zustand';
import { DirectMessage, Message } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc } from '../lib/firebase';
import { useUIStore } from './uiStore';

interface DmState {
  dms: DirectMessage[];
  messages: Message[];
  loading: boolean;
  activeDmId: string | null;
  unsubDms: (() => void) | null;
  unsubMessages: (() => void) | null;
  
  subscribeToDms: () => void;
  subscribeToDm: (dmId: string) => void;
  sendMessage: (content: string, type?: Message['type'], fileUrl?: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  startDm: (targetUserId: string) => Promise<string | null>;
}

export const useDmStore = create<DmState>((set, get) => ({
  dms: [],
  messages: [],
  loading: false,
  activeDmId: null,
  unsubDms: null,
  unsubMessages: null,
  
  subscribeToDms: () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    // Firestore rules only allow reading if our uid is in the dmId string
    // This query is a bit hard with standard where clauses if dmId is just a string
    // Actually, we should query based on participants array or just listen to all if we can't easily query
    // Wait, since we can't array-contains query easily without proper indexing, 
    // let's assume we can fetch them or we just rely on friends list.
    // For now, let's keep it simple: we don't query a list, we just create them on demand.
  },
  
  subscribeToDm: (dmId: string) => {
    const { unsubMessages } = get();
    if (unsubMessages) unsubMessages();
    
    if (!dmId) {
      set({ messages: [], activeDmId: null, unsubMessages: null });
      return;
    }
    
    set({ loading: true, activeDmId: dmId });
    
    const messagesRef = collection(db, 'direct_messages', dmId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
    
    const newUnsub = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      set({ messages, loading: false });
    });
    
    set({ unsubMessages: newUnsub });
  },
  
  sendMessage: async (content: string, type = 'text', fileUrl?: string) => {
    const { activeDmId } = get();
    const uid = auth.currentUser?.uid;
    if (!activeDmId || !uid || (!content.trim() && !fileUrl)) return;
    
    const messagesRef = collection(db, 'direct_messages', activeDmId, 'messages');
    await addDoc(messagesRef, {
      channelId: activeDmId,
      senderId: uid,
      content,
      type,
      fileUrl: fileUrl || null,
      createdAt: Date.now(),
    });
    
    // Update lastMessageAt
    await setDoc(doc(db, 'direct_messages', activeDmId), {
      lastMessageAt: Date.now()
    }, { merge: true });
  },
  
  deleteMessage: async (messageId: string) => {
    const { activeDmId } = get();
    if (!activeDmId) return;
    const msgRef = doc(db, 'direct_messages', activeDmId, 'messages', messageId);
    await deleteDoc(msgRef);
  },
  
  editMessage: async (messageId: string, content: string) => {
    const { activeDmId } = get();
    if (!activeDmId) return;
    const msgRef = doc(db, 'direct_messages', activeDmId, 'messages', messageId);
    await updateDoc(msgRef, { content, editedAt: Date.now() });
  },
  
  startDm: async (targetUserId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    
    const dmId = [uid, targetUserId].sort().join('_');
    
    const dmRef = doc(db, 'direct_messages', dmId);
    const dmDoc = await getDoc(dmRef);
    
    if (!dmDoc.exists()) {
      await setDoc(dmRef, {
        participants: [uid, targetUserId],
        createdAt: Date.now(),
        lastMessageAt: Date.now()
      });
    }
    
    useUIStore.getState().setActiveDm(dmId);
    return dmId;
  }
}));
