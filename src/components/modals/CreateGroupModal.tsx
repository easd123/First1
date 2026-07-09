import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, serverTimestamp, writeBatch } from '../../lib/firebase';
import { generateId } from '../../lib/utils';
import { X } from 'lucide-react';

export function CreateGroupModal() {
  const { setCreateGroupModal, setActiveGroup } = useUIStore();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    
    setLoading(true);
    try {
      const groupId = generateId();
      const batch = writeBatch();
      
      // Create Group
      const groupRef = doc(db, 'groups', groupId);
      batch.set(groupRef, {
        name: name.trim(),
        description: '',
        avatar: '',
        banner: '',
        ownerId: user.userId,
        inviteCode: generateId(),
        createdAt: serverTimestamp()
      });
      
      // Create Member
      const memberRef = doc(db, 'groups', groupId, 'members', user.userId);
      batch.set(memberRef, {
        groupId,
        userId: user.userId,
        role: 'owner',
        joinedAt: serverTimestamp()
      });
      
      // Create Default Category
      const catId = generateId();
      const catRef = doc(db, 'groups', groupId, 'categories', catId);
      batch.set(catRef, {
        groupId,
        name: 'Text Channels',
        order: 0,
        createdAt: serverTimestamp()
      });
      
      // Create Default Channel
      const chanId = generateId();
      const chanRef = doc(db, 'groups', groupId, 'channels', chanId);
      batch.set(chanRef, {
        groupId,
        categoryId: catId,
        name: 'general',
        type: 'text',
        order: 0,
        createdAt: serverTimestamp()
      });
      
      await batch.commit();
      
      setCreateGroupModal(false);
      setActiveGroup(groupId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#313338] w-full max-w-md rounded-lg shadow-xl flex flex-col relative overflow-hidden">
        <button 
          onClick={() => setCreateGroupModal(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Customize your server</h2>
          <p className="text-zinc-400 text-sm">Give your new server a personality with a name and an icon. You can always change it later.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 pt-0">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Server Name</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`${user?.displayName}'s server`}
              className="w-full bg-[#1e1f22] text-zinc-200 p-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={100}
            />
          </div>
          
          <div className="bg-[#2b2d31] p-4 flex justify-between items-center rounded-b-lg">
            <button 
              type="button" 
              onClick={() => setCreateGroupModal(false)}
              className="text-zinc-300 hover:underline text-sm font-medium px-4 py-2"
            >
              Back
            </button>
            <button 
              type="submit"
              disabled={!name.trim() || loading}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-6 py-2.5 rounded text-sm font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
