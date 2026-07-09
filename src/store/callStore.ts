import { create } from 'zustand';
import { collection, query, where, onSnapshot, addDoc, db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { useUIStore } from './uiStore';
import { useWebRTCStore } from './webrtcStore';

interface CallState {
  incomingCall: any | null;
  listenForCalls: () => void;
  ringServer: (groupId: string, channelId: string) => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
}

let unsub: any = null;

export const useCallStore = create<CallState>((set, get) => ({
  incomingCall: null,
  
  listenForCalls: () => {
    if (unsub) unsub();
    
    const callsRef = collection(db, 'calls');
    const q = query(callsRef, where('status', '==', 'ringing'));
    
    unsub = onSnapshot(q, (snapshot: any) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      
      let foundCall = null;
      snapshot.docs.forEach((d: any) => {
        const data = d.data();
        if (data.callerId !== user.userId && (Date.now() - data.createdAt) < 30000) {
          foundCall = { id: d.id, ...data };
        }
      });
      
      set({ incomingCall: foundCall });
    });
  },
  
  ringServer: async (groupId: string, channelId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    await addDoc(collection(db, 'calls'), {
      groupId,
      channelId,
      callerId: user.userId,
      status: 'ringing',
      createdAt: Date.now()
    });
  },
  
  acceptCall: () => {
    const call = get().incomingCall;
    if (call) {
      const { setActiveGroup, setActiveChannel } = useUIStore.getState();
      
      setActiveGroup(call.groupId);
      setActiveChannel(call.channelId);
      
      set({ incomingCall: null });
    }
  },
  
  rejectCall: () => {
    set({ incomingCall: null });
  }
}));
