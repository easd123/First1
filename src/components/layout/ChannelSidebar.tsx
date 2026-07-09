import React, { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { Hash, Volume2, Plus, Users, Settings, UserPlus, X } from 'lucide-react';
import { cn, getInitials } from '../../lib/utils';
import { Channel } from '../../types';
import { UserProfileBanner } from '../UserProfileBanner';

export function ChannelSidebar() {
  const { activeView, activeGroupId, activeChannelId, activeDmId, recentDms, setActiveDm, setActiveChannel, setActiveView, setCreateChannelModal, setInviteModal } = useUIStore();
  const { groups, categories, channels, loadGroupData } = useGroupStore();
  const { user } = useAuthStore();
  const { users, fetchAllUsers } = useUserStore();

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useEffect(() => {
    if (activeGroupId) {
      loadGroupData(activeGroupId);
    }
  }, [activeGroupId, loadGroupData]);

  const group = groups.find(g => g.id === activeGroupId);

  const renderGroupSidebar = () => {
    if (!group) return null;
    
    // Group channels by category
    const uncategorized = channels.filter(c => !c.categoryId);
    const categorized = categories.map(cat => ({
      ...cat,
      channels: channels.filter(c => c.categoryId === cat.id)
    }));

    return (
      <div className="flex-1 overflow-y-auto flex flex-col p-2 gap-4">
        {/* Uncategorized Channels */}
        <div className="space-y-0.5">
          {uncategorized.map(renderChannel)}
        </div>
        
        {/* Categories */}
        {categorized.map(cat => (
          <div key={cat.id} className="space-y-0.5">
            <div className="flex items-center justify-between px-2 group cursor-pointer hover:text-black dark:hover:text-zinc-300 text-zinc-500 dark:text-zinc-400">
              <h3 className="text-xs font-bold uppercase tracking-wider select-none">{cat.name}</h3>
              <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                e.stopPropagation();
                // setCreateChannelModal(true, cat.id) - extend UI store to accept pre-selected category
                setCreateChannelModal(true);
              }}/>
            </div>
            {cat.channels.map(renderChannel)}
          </div>
        ))}
      </div>
    );
  };

  const renderChannel = (channel: Channel) => {
    const isActive = activeChannelId === channel.id;
    const isVoice = channel.type === 'voice';
    const Icon = isVoice ? Volume2 : Hash;

    return (
      <button
        key={channel.id}
        onClick={() => setActiveChannel(channel.id)}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-[#35373c] transition-colors group",
          isActive && "bg-black/10 dark:bg-[#404249] text-black dark:text-zinc-100 hover:text-black dark:hover:text-zinc-100 hover:bg-black/10 dark:hover:bg-[#404249]"
        )}
      >
        <Icon size={18} className="flex-shrink-0" />
        <span className="truncate text-sm font-medium">{channel.name}</span>
      </button>
    );
  };

  const renderHomeSidebar = () => (
    <div className="flex-1 overflow-y-auto p-2">
        <button 
        onClick={() => setActiveView('friends')}
        className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-[#35373c] transition-colors",
          activeView === 'friends' && "bg-black/10 dark:bg-[#404249] text-black dark:text-white"
        )}
      >
        <Users size={20} />
        <span className="font-medium">Friends</span>
      </button>
      
      <div className="mt-4 px-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 select-none hover:text-zinc-300 transition-colors cursor-pointer">
          Direct Messages
        </h3>
        
        {recentDms.length > 0 ? (
          <div className="space-y-0.5">
            {recentDms.map(dmId => {
              const targetUserId = dmId.split('_').find(id => id !== user?.userId);
              const targetUser = targetUserId ? users[targetUserId] : null;
              if (!targetUser) return null;
              
              const isActive = activeView === 'dm' && activeDmId === dmId;
              return (
                <button 
                  key={dmId}
                  onClick={() => setActiveDm(dmId)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-[#35373c] transition-colors group",
                    isActive && "bg-black/10 dark:bg-[#404249] text-black dark:text-zinc-100 hover:text-black dark:hover:text-zinc-100 hover:bg-black/10 dark:hover:bg-[#404249]"
                  )}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {targetUser.avatar ? <img src={targetUser.avatar} className="w-full h-full object-cover" /> : getInitials(targetUser.displayName)}
                    </div>
                    <div className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-100 dark:border-[#2b2d31]",
                      targetUser.status === 'online' ? "bg-green-500" :
                      targetUser.status === 'idle' ? "bg-yellow-500" :
                      targetUser.status === 'dnd' ? "bg-red-500" : "bg-gray-500"
                    )} />
                  </div>
                  <span className="truncate text-sm font-medium flex-1 text-left">{targetUser.displayName}</span>
                  <X size={14} className="opacity-0 group-hover:opacity-100 hover:text-black dark:hover:text-white" onClick={(e) => {
                    e.stopPropagation();
                    useUIStore.setState(s => ({ recentDms: s.recentDms.filter(id => id !== dmId) }));
                    if (isActive) setActiveView('friends');
                  }} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-zinc-500 italic p-2">No active DMs</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-[240px] h-full bg-zinc-100 dark:bg-[#2b2d31] flex flex-col flex-shrink-0 border-r border-zinc-200 dark:border-transparent z-10 transition-colors">
      {/* Header */}
      <header className="h-12 border-b border-zinc-200 dark:border-[#1e1f22] flex items-center px-4 shadow-sm z-10 flex-shrink-0 hover:bg-black/5 dark:hover:bg-[#35373c] transition-colors">
        {activeView === 'group' && group ? (
          <div className="w-full flex items-center justify-between group cursor-pointer" onClick={() => {}}>
            <h2 className="font-bold text-black dark:text-white truncate">{group.name}</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); setInviteModal(true); }}
              className="text-zinc-400 hover:text-indigo-500 transition-colors p-1"
              title="Invite People"
            >
              <UserPlus size={18} />
            </button>
          </div>
        ) : (
          <div className="w-full h-7 bg-black/5 dark:bg-[#1e1f22] rounded text-sm text-zinc-500 dark:text-zinc-400 flex items-center px-2">
            Find or start a conversation
          </div>
        )}
      </header>

      {/* Main List */}
      {activeView === 'group' ? renderGroupSidebar() : renderHomeSidebar()}

      {/* Current User Profile Panel at Bottom */}
      <UserProfileBanner user={user!} />
    </div>
  );
}
