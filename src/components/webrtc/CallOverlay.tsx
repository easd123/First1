import React, { useEffect } from 'react';
import { useCallStore } from '../../store/callStore';
import { useUserStore } from '../../store/userStore';
import { useGroupStore } from '../../store/groupStore';
import { Phone, PhoneOff } from 'lucide-react';
import { getInitials } from '../../lib/utils';

export function CallOverlay() {
  const { incomingCall, acceptCall, rejectCall } = useCallStore();
  const { users, fetchUser } = useUserStore();
  const { groups } = useGroupStore();
  
  useEffect(() => {
    if (incomingCall && !users[incomingCall.callerId]) {
      fetchUser(incomingCall.callerId);
    }
  }, [incomingCall, users, fetchUser]);
  
  if (!incomingCall) return null;
  
  const caller = users[incomingCall.callerId];
  const group = groups.find(g => g.id === incomingCall.groupId);
  
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1e1f22] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-indigo-500/30 p-4 z-50 flex items-center gap-6">
      <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-inner">
        {caller?.avatar ? <img src={caller.avatar} className="w-full h-full object-cover" /> : getInitials(caller?.displayName || 'User')}
      </div>
      <div className="flex flex-col pr-4">
        <h4 className="text-black dark:text-white font-bold text-lg">{caller?.displayName || 'Someone'} is calling...</h4>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{group ? `from ${group.name}` : 'Server voice call'}</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={rejectCall} className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-red-500/25 active:scale-95">
          <PhoneOff size={22} />
        </button>
        <button onClick={acceptCall} className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-green-500/25 active:scale-95 animate-pulse">
          <Phone size={22} />
        </button>
      </div>
    </div>
  );
}
