import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MoreVertical, MessageSquare } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, deleteDoc } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { useDmStore } from '../../store/dmStore';
import { getInitials, cn, generateId } from '../../lib/utils';
import { User, FriendRequest } from '../../types';

export function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'add'>('all');
  const [searchUsername, setSearchUsername] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const { user } = useAuthStore();
  const { users, fetchAllUsers } = useUserStore();
  const { setActiveProfile } = useUIStore();
  const { startDm } = useDmStore();

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const otherUsers = Object.values(users).filter(u => u.userId !== user?.userId);
  
  // A real app would subscribe to friends and friend requests.
  // We'll mock the UI structure for speed, but add actual backend calls for "Add Friend"
  
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!searchUsername.trim()) return;
    
    try {
      // Find user by username
      const q = query(collection(db, 'users'), where('username', '==', searchUsername.toLowerCase().trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setAddError("Hm, didn't work. Double check that the username is correct.");
        return;
      }
      
      const targetUser = snap.docs[0].data() as User;
      if (targetUser.userId === user?.userId) {
        setAddError("You can't add yourself as a friend.");
        return;
      }
      
      // Create friend request
      const reqId = `${user?.userId}_${targetUser.userId}`;
      await setDoc(doc(db, 'friend_requests', reqId), {
        id: reqId,
        senderId: user?.userId,
        receiverId: targetUser.userId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setAddSuccess(`Success! Your friend request to ${targetUser.username} was sent.`);
      setSearchUsername('');
    } catch (err: any) {
      setAddError(err.message || "Failed to send request.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-transparent relative z-0">
      <header className="h-16 flex items-center px-6 border-b border-white/5 bg-white/5 backdrop-blur-xl gap-6">
        <div className="flex items-center gap-2 text-zinc-100 font-medium mr-4">
          <UserPlus size={24} className="text-zinc-400" />
          Friends
        </div>
        
        <div className="flex items-center gap-4">
          {(['online', 'all', 'pending', 'add'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn("px-2 py-1 rounded-md text-sm font-medium transition-colors",
                activeTab === tab 
                  ? (tab === 'add' ? "bg-green-600 text-white" : "bg-[#404249] text-zinc-100") 
                  : (tab === 'add' ? "text-green-500 hover:bg-[#35373c]" : "text-zinc-400 hover:bg-[#35373c] hover:text-zinc-300")
              )}
            >
              {tab === 'add' ? 'Add Friend' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>
      
      <div className="flex-1 flex">
        <div className="flex-1 p-8 flex flex-col">
          {activeTab === 'add' ? (
            <div className="max-w-[600px]">
              <h2 className="text-white font-bold text-lg mb-2">ADD FRIEND</h2>
              <p className="text-zinc-400 text-sm mb-4">You can add a friend with their Discord Username.</p>
              
              <form onSubmit={handleAddFriend} className="relative group">
                <input
                  type="text"
                  value={searchUsername}
                  onChange={e => setSearchUsername(e.target.value)}
                  placeholder="You can add friends with their Discord username."
                  className="w-full bg-[#1e1f22] border border-[#1e1f22] focus:border-indigo-500 text-zinc-200 p-4 pr-32 rounded-lg outline-none transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!searchUsername.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white px-4 rounded transition-colors text-sm font-medium"
                >
                  Send Friend Request
                </button>
              </form>
              
              {addError && <p className="text-red-400 text-sm mt-2">{addError}</p>}
              {addSuccess && <p className="text-green-400 text-sm mt-2">{addSuccess}</p>}
            </div>
          ) : activeTab === 'all' && otherUsers.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-4">
              <h2 className="text-zinc-400 font-semibold text-xs uppercase tracking-wider mb-4 mt-2">All Users — {otherUsers.length}</h2>
              <div className="flex flex-col gap-0.5">
                {otherUsers.map(u => (
                  <div key={u.userId} className="flex items-center justify-between p-3 hover:bg-[#35373c] rounded-lg group cursor-pointer border-t border-[#1e1f22] first:border-t-0 transition-colors" onClick={() => setActiveProfile(u.userId)}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden">
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : getInitials(u.displayName)}
                        </div>
                        <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#313338]",
                          u.status === 'online' ? "bg-green-500" :
                          u.status === 'idle' ? "bg-yellow-500" :
                          u.status === 'dnd' ? "bg-red-500" : "bg-gray-500"
                        )} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-100">{u.displayName}</span>
                        <span className="text-sm text-zinc-400">{u.username}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startDm(u.userId); }}
                        className="w-9 h-9 rounded-full bg-[#2b2d31] flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Message"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button className="w-9 h-9 rounded-full bg-[#2b2d31] flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-zinc-500">
              <div className="w-64 h-64 bg-[url('https://discord.com/assets/1ffb3d75069f5280ee2e.svg')] bg-contain bg-no-repeat mb-4 opacity-50" />
              <p>No one is around to play with Wumpus.</p>
            </div>
          )}
        </div>
        
        {/* Active Now Sidebar */}
        <div className="w-[360px] border-l border-[#1e1f22] p-4 hidden lg:block">
          <h3 className="text-white font-bold text-xl mb-4">Active Now</h3>
          <div className="text-center p-4">
            <h4 className="text-zinc-100 font-medium mb-1">It's quiet for now...</h4>
            <p className="text-zinc-400 text-sm">When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
