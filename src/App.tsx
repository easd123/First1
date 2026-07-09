import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useGroupStore } from './store/groupStore';
import { useUIStore } from './store/uiStore';
import { useCallStore } from './store/callStore';
import { ServerSidebar } from './components/layout/ServerSidebar';
import { ChannelSidebar } from './components/layout/ChannelSidebar';
import { MainArea } from './components/layout/MainArea';
import { AuthScreen } from './components/AuthScreen';
import { CallOverlay } from './components/webrtc/CallOverlay';
import { ProfilePopup } from './components/modals/ProfilePopup';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const { fetchGroups } = useGroupStore();
  const { listenForCalls } = useCallStore();
  const theme = useUIStore(s => s.theme);
  const isMobileSidebarOpen = useUIStore(s => s.isMobileSidebarOpen);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) {
      fetchGroups();
      listenForCalls();
    }
  }, [user, fetchGroups, listenForCalls]);

  if (loading) {
    return <div className="h-screen w-screen bg-[#313338] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className={`h-screen w-screen flex overflow-hidden ${theme === 'dark' ? 'dark' : ''} bg-zinc-100 dark:bg-[#313338] text-black dark:text-zinc-300 font-sans`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => useUIStore.getState().setMobileSidebarOpen(false)}
        />
      )}
      
      <div className={`flex h-full fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* 1. Far Left Server Sidebar */}
        <ServerSidebar />
        
        {/* 2. Middle Channel/DM Sidebar */}
        <ChannelSidebar />
      </div>

      {/* 3. Main Chat/Content Area */}
      <MainArea />
      
      {/* Call Overlay */}
      <CallOverlay />
      
      {/* Popups */}
      <ProfilePopup />
      
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: theme === 'dark' ? '#2b2d31' : '#fff',
          color: theme === 'dark' ? '#fff' : '#000',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      }} />
    </div>
  );
}
