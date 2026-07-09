import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGroupStore } from '../../store/groupStore';
import { X, Check } from 'lucide-react';

export function InviteModal() {
  const { activeGroupId, setInviteModal } = useUIStore();
  const { inviteUserToGroup } = useGroupStore();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !activeGroupId) return;

    setLoading(true);
    setResult(null);
    const res = await inviteUserToGroup(activeGroupId, username.trim());
    setResult(res);
    setLoading(false);
    if (res.success) {
      setTimeout(() => setInviteModal(false), 2000);
    }
  };

  if (!activeGroupId) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-50 dark:bg-[#313338] w-full max-w-md rounded-xl shadow-2xl p-6 relative border border-black/10 dark:border-white/10">
        <button 
          onClick={() => setInviteModal(false)}
          className="absolute top-4 right-4 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2 text-center">Invite to Server</h2>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mb-6">Enter a username to invite them to this server.</p>
        
        <form onSubmit={handleInvite}>
          <div className="mb-4">
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Username</label>
            <input 
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. cooluser123"
              className="w-full bg-zinc-200 dark:bg-[#1e1f22] text-black dark:text-zinc-100 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              autoFocus
            />
          </div>
          
          {result && (
            <div className={`p-3 rounded-md mb-4 text-sm ${result.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {result.message}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Inviting...' : 'Send Invite'}
          </button>
        </form>
      </div>
    </div>
  );
}
