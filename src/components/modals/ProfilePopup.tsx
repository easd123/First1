import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useDmStore } from '../../store/dmStore';
import { X, MessageSquare, UserPlus } from 'lucide-react';
import { getInitials, cn } from '../../lib/utils';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from '../../lib/firebase';

export function ProfilePopup() {
  const { activeProfileId, setActiveProfile } = useUIStore();
  const { users } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const { startDm } = useDmStore();

  const user = activeProfileId ? users[activeProfileId] : null;

  if (!user || !activeProfileId) return null;

  const handleMessage = async () => {
    await startDm(activeProfileId);
    setActiveProfile(null);
  };

  const handleAddFriend = async () => {
    if (!currentUser) return;
    const reqId = `${currentUser.userId}_${activeProfileId}`;
    await setDoc(doc(db, 'friend_requests', reqId), {
      id: reqId,
      senderId: currentUser.userId,
      receiverId: activeProfileId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    alert('Friend request sent!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setActiveProfile(null)}>
      <div 
        className="bg-[#232428] w-full max-w-sm rounded-xl shadow-2xl relative overflow-hidden border border-white/10" 
        onClick={e => e.stopPropagation()}
      >
        <div className="h-24 bg-indigo-500 w-full" style={user.banner ? { backgroundImage: `url(${user.banner})`, backgroundSize: 'cover' } : {}} />
        
        <button 
          onClick={() => setActiveProfile(null)}
          className="absolute top-4 right-4 text-white hover:text-zinc-200 bg-black/30 p-1 rounded-full"
        >
          <X size={16} />
        </button>

        <div className="px-4 pb-4">
          <div className="relative -mt-12 mb-3">
            <div className="w-24 h-24 rounded-full bg-[#232428] p-1.5 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : getInitials(user.displayName)}
              </div>
            </div>
            <div className={cn("absolute bottom-2 right-2 w-5 h-5 rounded-full border-[3px] border-[#232428]",
              user.status === 'online' ? "bg-green-500" :
              user.status === 'idle' ? "bg-yellow-500" :
              user.status === 'dnd' ? "bg-red-500" : "bg-gray-500"
            )} />
          </div>

          <div className="bg-[#111214] p-3 rounded-lg mb-4">
            <h2 className="text-xl font-bold text-white leading-tight">{user.displayName}</h2>
            <p className="text-zinc-400 text-sm">@{user.username}</p>
          </div>
          
          <div className="w-full h-[1px] bg-white/10 my-4" />

          {currentUser?.userId !== activeProfileId && (
            <div className="flex gap-2">
              <button 
                onClick={handleMessage}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare size={16} /> Send Message
              </button>
              <button 
                onClick={handleAddFriend}
                className="bg-[#404249] hover:bg-[#474a52] text-white font-medium p-2 rounded transition-colors flex items-center justify-center"
                title="Add Friend"
              >
                <UserPlus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
