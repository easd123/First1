import { create } from 'zustand';
import { WebRTCManager } from '../lib/webrtc';

interface WebRTCState {
  roomId: string | null;
  streams: Record<string, MediaStream>; // peerId -> stream
  participants: Record<string, any>; // peerId -> data
  audioEnabled: boolean;
  videoEnabled: boolean;
  deafened: boolean;
  manager: WebRTCManager | null;
  
  joinRoom: (roomId: string, video?: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleDeafen: () => void;
}

export const useWebRTCStore = create<WebRTCState>((set, get) => ({
  roomId: null,
  streams: {},
  participants: {},
  audioEnabled: true,
  videoEnabled: false,
  deafened: false,
  manager: null,
  
  joinRoom: async (roomId: string, video = false) => {
    const manager = new WebRTCManager(
      (peerId, stream) => {
        set(state => ({
          streams: { ...state.streams, [peerId]: stream }
        }));
      },
      (peerId) => {
        set(state => {
          const newStreams = { ...state.streams };
          delete newStreams[peerId];
          return { streams: newStreams };
        });
      },
      (peerId, data) => {
        set(state => {
          const newParticipants = { ...state.participants };
          if (data === null) {
            delete newParticipants[peerId];
          } else {
            newParticipants[peerId] = data;
          }
          return { participants: newParticipants };
        });
      }
    );
    
    await manager.joinRoom(roomId, video);
    set({ roomId, manager, videoEnabled: video, audioEnabled: true });
    
    // Add local stream
    const local = manager.getLocalStream();
    if (local) {
      set(state => ({
        streams: { ...state.streams, ['local']: local }
      }));
    }
  },
  
  leaveRoom: async () => {
    const { manager } = get();
    if (manager) {
      await manager.leaveRoom();
    }
    set({ roomId: null, manager: null, streams: {}, participants: {} });
  },
  
  toggleAudio: () => {
    const { manager, audioEnabled } = get();
    if (manager) {
      manager.toggleAudio(!audioEnabled);
    }
    set({ audioEnabled: !audioEnabled });
  },
  
  toggleVideo: () => {
    const { manager, videoEnabled } = get();
    if (manager) {
      manager.toggleVideo(!videoEnabled);
    }
    set({ videoEnabled: !videoEnabled });
  },
  
  toggleDeafen: () => {
    const { deafened, manager, audioEnabled } = get();
    const newDeafened = !deafened;
    
    // If we deafen, we also mute ourselves
    if (newDeafened) {
      if (manager && audioEnabled) manager.toggleAudio(false);
      set({ audioEnabled: false, deafened: newDeafened });
    } else {
      if (manager && !audioEnabled) manager.toggleAudio(true);
      set({ audioEnabled: true, deafened: newDeafened });
    }
  }
}));
