import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGroupStore } from '../../store/groupStore';
import { MessageSquare, Plus, Compass } from 'lucide-react';
import { cn, getInitials } from '../../lib/utils';

export function ServerSidebar() {
  const { activeView, activeGroupId, setActiveView, setActiveGroup, setCreateGroupModal } = useUIStore();
  const { groups } = useGroupStore();

  return (
    <div className="w-[72px] h-full bg-zinc-200 dark:bg-[#1e1f22] flex flex-col items-center py-3 gap-2 flex-shrink-0 z-20 transition-colors">
      {/* Home / DMs Button */}
      <div className="relative group">
        <div className={cn("absolute -left-3 top-1/2 -translate-y-1/2 w-1 bg-black dark:bg-white rounded-r-full transition-all duration-300", 
          activeView === 'home' || activeView === 'dm' || activeView === 'friends' ? "h-10" : "h-0 group-hover:h-5"
        )} />
        <button 
          onClick={() => setActiveView('home')}
          className={cn("w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center text-zinc-300 bg-[#313338] hover:bg-indigo-500 hover:text-white group",
            (activeView === 'home' || activeView === 'dm' || activeView === 'friends') && "bg-indigo-500 text-white rounded-[16px]"
          )}
        >
          <MessageSquare size={24} />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-[#3f4147] rounded-full mx-auto" />

      {/* Server List */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-2 no-scrollbar">
        {groups.map(group => (
          <div key={group.id} className="relative group w-full flex justify-center">
            <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-black dark:bg-white rounded-r-full transition-all duration-300", 
              activeGroupId === group.id ? "h-10" : "h-0 group-hover:h-5"
            )} />
            <button 
              onClick={() => setActiveGroup(group.id)}
              className={cn("w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center bg-[#313338] text-zinc-100 overflow-hidden font-medium text-lg",
                activeGroupId === group.id && "bg-indigo-500 text-white rounded-[16px]"
              )}
            >
              {group.avatar ? (
                <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(group.name)
              )}
            </button>
          </div>
        ))}
        
        {/* Create Group Button */}
        <div className="relative group w-full flex justify-center mt-2">
          <button 
            onClick={() => setCreateGroupModal(true)}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center bg-[#313338] text-green-500 hover:bg-green-500 hover:text-white"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
