import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGroupStore } from '../../store/groupStore';
import { FriendsPage } from '../friends/FriendsPage';
import { ChatArea } from '../chat/ChatArea';
import { DmArea } from '../chat/DmArea';
import { ActiveVoiceChannel } from '../webrtc/ActiveVoiceChannel';
import { CreateGroupModal } from '../modals/CreateGroupModal';
import { CreateChannelModal } from '../modals/CreateChannelModal';
import { SettingsModal } from '../modals/SettingsModal';
import { InviteModal } from '../modals/InviteModal';
import { Menu } from 'lucide-react';

export function MainArea() {
  const { activeView, activeChannelId, activeGroupId, activeDmId, isCreateGroupModalOpen, isCreateChannelModalOpen, isSettingsModalOpen, isInviteModalOpen, setMobileSidebarOpen } = useUIStore();
  const { channels } = useGroupStore();

  const renderContent = () => {
    if (activeView === 'friends' || activeView === 'home') {
      return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0">
          <header className="h-12 border-b border-zinc-200 dark:border-[#1e1f22] flex items-center px-4 flex-shrink-0 shadow-sm z-10 bg-zinc-100/50 dark:bg-[#313338] md:hidden">
            <button onClick={() => setMobileSidebarOpen(true)} className="p-1 mr-2 text-zinc-500 hover:text-black dark:hover:text-white">
              <Menu size={24} />
            </button>
            <h2 className="font-bold text-black dark:text-white">Friends</h2>
          </header>
          <FriendsPage />
        </div>
      );
    }
    
    if (activeView === 'group' && activeGroupId && activeChannelId) {
      const channel = channels.find(c => c.id === activeChannelId);
      
      if (!channel) {
        return (
          <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0">
            <header className="h-12 border-b border-zinc-200 dark:border-[#1e1f22] flex items-center px-4 flex-shrink-0 shadow-sm z-10 bg-zinc-100/50 dark:bg-[#313338] md:hidden">
              <button onClick={() => setMobileSidebarOpen(true)} className="p-1 mr-2 text-zinc-500 hover:text-black dark:hover:text-white">
                <Menu size={24} />
              </button>
            </header>
            <div className="flex-1 flex items-center justify-center text-zinc-500">Channel not found.</div>
          </div>
        );
      }
      
      return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0">
          {/* Header */}
          <header className="h-12 border-b border-zinc-200 dark:border-[#1e1f22] flex items-center px-4 flex-shrink-0 shadow-sm z-10 bg-zinc-100/50 dark:bg-[#313338]">
            <button onClick={() => setMobileSidebarOpen(true)} className="p-1 mr-2 text-zinc-500 hover:text-black dark:hover:text-white md:hidden">
              <Menu size={24} />
            </button>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xl mr-2">
              {channel.type === 'voice' ? '🔊' : '#'}
            </span>
            <h2 className="font-bold text-black dark:text-white truncate">{channel.name}</h2>
          </header>
          
          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {channel.type === 'voice' ? (
              <ActiveVoiceChannel channel={channel} />
            ) : (
              <ChatArea channel={channel} />
            )}
          </div>
        </div>
      );
    }
    
    if (activeView === 'dm' && activeDmId) {
      return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0">
          {/* Header */}
          <header className="h-12 border-b border-zinc-200 dark:border-[#1e1f22] flex items-center px-4 flex-shrink-0 shadow-sm z-10 bg-zinc-100/50 dark:bg-[#313338]">
            <button onClick={() => setMobileSidebarOpen(true)} className="p-1 mr-2 text-zinc-500 hover:text-black dark:hover:text-white md:hidden">
              <Menu size={24} />
            </button>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xl mr-2">@</span>
            <h2 className="font-bold text-black dark:text-white truncate">Direct Message</h2>
          </header>
          
          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            <DmArea dmId={activeDmId} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center flex-col text-zinc-500 bg-white dark:bg-[#313338] relative">
        <header className="absolute top-0 left-0 right-0 h-12 border-b border-zinc-200 dark:border-[#1e1f22] flex items-center px-4 flex-shrink-0 shadow-sm z-10 bg-zinc-100/50 dark:bg-[#313338] md:hidden">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1 mr-2 text-zinc-500 hover:text-black dark:hover:text-white">
            <Menu size={24} />
          </button>
        </header>
        <div className="w-64 h-64 bg-[url('https://discord.com/assets/1ffb3d75069f5280ee2e.svg')] bg-contain bg-no-repeat mb-4 opacity-50" />
        <p>No channel selected.</p>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-[#313338]">
      {renderContent()}
      
      {/* Modals */}
      {isCreateGroupModalOpen && <CreateGroupModal />}
      {isCreateChannelModalOpen && <CreateChannelModal />}
      {isSettingsModalOpen && <SettingsModal />}
      {isInviteModalOpen && <InviteModal />}
    </div>
  );
}
