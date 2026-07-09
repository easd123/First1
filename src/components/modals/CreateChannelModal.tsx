import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from '../../lib/firebase';
import { generateId } from '../../lib/utils';
import { X, Hash, Volume2 } from 'lucide-react';

export function CreateChannelModal() {
  const { setCreateChannelModal, activeGroupId, setActiveChannel } = useUIStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeGroupId) return;
    
    setLoading(true);
    try {
      const chanId = generateId();
      const chanRef = doc(db, 'groups', activeGroupId, 'channels', chanId);
      
      const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');
      
      await setDoc(chanRef, {
        groupId: activeGroupId,
        categoryId: null, // Just putting it at top level for now
        name: sanitizedName,
        type,
        order: Date.now(), // simple order
        createdAt: serverTimestamp()
      });
      
      setCreateChannelModal(false);
      setActiveChannel(chanId);
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
          onClick={() => setCreateChannelModal(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Create Channel</h2>
          
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Channel Type</label>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-3 p-3 rounded bg-[#2b2d31] cursor-pointer border transition-colors ${type === 'text' ? 'border-indigo-500' : 'border-transparent hover:bg-[#35373c]'}`}>
                  <input type="radio" name="type" value="text" checked={type === 'text'} onChange={() => setType('text')} className="hidden" />
                  <Hash size={24} className="text-zinc-400" />
                  <div>
                    <div className="text-zinc-200 font-medium">Text</div>
                    <div className="text-zinc-400 text-sm">Send messages, images, GIFs, emoji, opinions, and puns</div>
                  </div>
                </label>
                
                <label className={`flex items-center gap-3 p-3 rounded bg-[#2b2d31] cursor-pointer border transition-colors ${type === 'voice' ? 'border-indigo-500' : 'border-transparent hover:bg-[#35373c]'}`}>
                  <input type="radio" name="type" value="voice" checked={type === 'voice'} onChange={() => setType('voice')} className="hidden" />
                  <Volume2 size={24} className="text-zinc-400" />
                  <div>
                    <div className="text-zinc-200 font-medium">Voice</div>
                    <div className="text-zinc-400 text-sm">Hang out together with voice, video, and screen share</div>
                  </div>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Channel Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {type === 'text' ? <Hash size={18} /> : <Volume2 size={18} />}
                </span>
                <input 
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="new-channel"
                  className="w-full bg-[#1e1f22] text-zinc-200 p-3 pl-10 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                />
              </div>
            </div>
            
            <div className="bg-[#2b2d31] p-4 flex justify-end items-center rounded-b-lg -mx-6 -mb-6 mt-2">
              <button 
                type="button" 
                onClick={() => setCreateChannelModal(false)}
                className="text-zinc-300 hover:underline text-sm font-medium px-4 py-2 mr-2"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!name.trim() || loading}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-6 py-2.5 rounded text-sm font-medium transition-colors"
              >
                {loading ? "Creating..." : "Create Channel"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
