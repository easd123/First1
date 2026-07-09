import React from 'react';
import { User } from '../types';
import { Settings, Mic, Headphones } from 'lucide-react';
import { getInitials } from '../lib/utils';
import { useUIStore } from '../store/uiStore';
import { useWebRTCStore } from '../store/webrtcStore';
import { cn } from '../lib/utils';

interface Props {
  user: User;
}

export function UserProfileBanner({ user }: Props) {
  const { setSettingsModal } = useUIStore();
  const { audioEnabled, deafened, toggleAudio, toggleDeafen } = useWebRTCStore();

  return (
    <div className="h-[52px] bg-zinc-200/50 dark:bg-[#232428] flex items-center px-2 flex-shrink-0 justify-between transition-colors border-t border-zinc-200 dark:border-transparent">
      <button className="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-[#35373c] p-1 rounded-md transition-colors min-w-0 flex-1 mr-1">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" /> : getInitials(user.displayName)}
          </div>
          <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#232428]",
            user.status === 'online' ? "bg-green-500" :
            user.status === 'idle' ? "bg-yellow-500" :
            user.status === 'dnd' ? "bg-red-500" : "bg-gray-500"
          )} />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-semibold text-white truncate w-full text-left">{user.displayName}</span>
          <span className="text-[11px] text-zinc-400 leading-none truncate w-full text-left">#{user.username}</span>
        </div>
      </button>

      <div className="flex items-center">
        <button 
          onClick={toggleAudio}
          className={cn("p-1.5 rounded-md hover:bg-[#35373c] text-zinc-400 transition-colors relative", 
            !audioEnabled && "text-red-400"
          )}
        >
          <Mic size={18} />
          {!audioEnabled && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-0.5 bg-red-400 rotate-45 rounded-full" />}
        </button>
        <button 
          onClick={toggleDeafen}
          className={cn("p-1.5 rounded-md hover:bg-[#35373c] text-zinc-400 transition-colors relative",
            deafened && "text-red-400"
          )}
        >
          <Headphones size={18} />
          {deafened && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-0.5 bg-red-400 rotate-45 rounded-full" />}
        </button>
        <button 
          onClick={() => setSettingsModal(true)}
          className="p-1.5 rounded-md hover:bg-[#35373c] text-zinc-400 transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
