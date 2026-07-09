import React, { useState } from 'react';
import { loginAnonymously, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';
import { User } from '../types';
import { useUIStore } from '../store/uiStore';

export function AuthScreen() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    
    // Add simple username format validation
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, _, ., and -");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Note: In a real app we'd check if username is unique globally.
      // For this demo, we'll just log in anonymously and use it.
      const cred = await loginAnonymously();
      const userRef = doc(db, 'users', cred.user.uid);
      
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const newUser: Omit<User, 'createdAt'> & { createdAt: any } = {
          userId: cred.user.uid,
          username: username.toLowerCase().trim(),
          displayName: displayName.trim(),
          avatar: '', // blank uses initials
          status: 'online',
          lastSeen: Date.now(),
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newUser);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
      setLoading(false);
    }
  };

  return (
    <div className={`h-screen w-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="h-full w-full bg-zinc-50 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-slate-900 dark:to-black flex items-center justify-center p-4 font-sans text-black dark:text-zinc-300 relative overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 dark:opacity-20 pointer-events-none" />
        <div className="bg-white dark:bg-white/5 backdrop-blur-2xl p-10 rounded-2xl shadow-xl dark:shadow-[0_0_100px_rgba(79,70,229,0.15)] w-full max-w-md border border-zinc-200 dark:border-white/10 relative z-10 transition-colors">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2 text-center tracking-tight">Welcome to Serenity</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-center text-sm font-medium">Enter a name to join the conversation.</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-[#111214] text-black dark:text-zinc-100 p-3.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow border border-zinc-200 dark:border-transparent"
                placeholder="How others see you"
                maxLength={32}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-[#111214] text-black dark:text-zinc-100 p-3.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow border border-zinc-200 dark:border-transparent"
                placeholder="unique_username"
                maxLength={24}
              />
            </div>
            
            {error && <p className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-4 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 mt-6"
            >
              {loading ? "Connecting..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
