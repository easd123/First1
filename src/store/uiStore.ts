import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  activeView: 'home' | 'friends' | 'group' | 'dm' | 'settings';
  activeGroupId: string | null;
  activeChannelId: string | null;
  activeDmId: string | null;
  activeProfileId: string | null;
  recentDms: string[]; // List of DM IDs
  theme: 'dark' | 'light';
  
  isMobileSidebarOpen: boolean;
  
  // Modals
  isCreateGroupModalOpen: boolean;
  isCreateChannelModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isInviteModalOpen: boolean;
  
  setActiveView: (view: UIState['activeView']) => void;
  setActiveGroup: (id: string | null) => void;
  setActiveChannel: (id: string | null) => void;
  setActiveDm: (id: string | null) => void;
  setActiveProfile: (id: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setMobileSidebarOpen: (open: boolean) => void;
  
  setCreateGroupModal: (open: boolean) => void;
  setCreateChannelModal: (open: boolean) => void;
  setSettingsModal: (open: boolean) => void;
  setInviteModal: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeView: 'home',
      activeGroupId: null,
      activeChannelId: null,
      activeDmId: null,
      activeProfileId: null,
      recentDms: [],
      theme: 'dark', // default dark mode for discord vibe
      isMobileSidebarOpen: false,
      
      isCreateGroupModalOpen: false,
      isCreateChannelModalOpen: false,
      isSettingsModalOpen: false,
      isInviteModalOpen: false,
      
      setActiveView: (activeView) => set({ activeView, isMobileSidebarOpen: false }),
      setActiveGroup: (activeGroupId) => set({ activeGroupId, activeView: 'group', isMobileSidebarOpen: false }),
      setActiveChannel: (activeChannelId) => set({ activeChannelId, isMobileSidebarOpen: false }),
      setActiveDm: (activeDmId) => {
        set((state) => {
          const recentDms = activeDmId && !state.recentDms.includes(activeDmId) 
            ? [activeDmId, ...state.recentDms] 
            : state.recentDms;
          return { activeDmId, activeView: 'dm', isMobileSidebarOpen: false, recentDms };
        });
      },
      setActiveProfile: (activeProfileId) => set({ activeProfileId }),
      setTheme: (theme) => set({ theme }),
      setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
      
      setCreateGroupModal: (open) => set({ isCreateGroupModalOpen: open }),
      setCreateChannelModal: (open) => set({ isCreateChannelModalOpen: open }),
      setSettingsModal: (open) => set({ isSettingsModalOpen: open }),
      setInviteModal: (open) => set({ isInviteModalOpen: open }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme, recentDms: state.recentDms }),
    }
  )
);
