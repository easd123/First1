import { create } from 'zustand';
import { User } from '../types';
import { getDoc, doc, db, collection, getDocs, query, limit } from '../lib/firebase';

interface UserState {
  users: Record<string, User>;
  fetchUser: (userId: string) => Promise<User | null>;
  fetchAllUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: {},
  fetchUser: async (userId: string) => {
    const { users } = get();
    if (users[userId]) return users[userId];
    
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const user = snap.data() as User;
      set(state => ({ users: { ...state.users, [userId]: user } }));
      return user;
    }
    return null;
  },
  fetchAllUsers: async () => {
    try {
      const q = query(collection(db, 'users'), limit(50));
      const snap = await getDocs(q);
      const newUsers: Record<string, User> = {};
      snap.forEach(doc => {
        const u = doc.data() as User;
        newUsers[u.userId] = u;
      });
      set(state => ({ users: { ...state.users, ...newUsers } }));
    } catch (e) {
      console.error(e);
    }
  }
}));
