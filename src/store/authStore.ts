import { create } from 'zustand';
import { User } from '../types';
import { auth, db, doc, onSnapshot, updateDoc, onAuthStateChanged } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  initialize: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });
    
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to user document changes
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            set({ user: docSnap.data() as User, loading: false });
          } else {
            // User authenticated but no profile yet (in registration flow)
            set({ user: null, loading: false });
          }
        });
      } else {
        set({ user: null, loading: false });
      }
    });
  },
  updateProfile: async (data: Partial<User>) => {
    const { user } = get();
    if (!user) return;
    const userRef = doc(db, 'users', user.userId);
    await updateDoc(userRef, { ...data });
  }
}));
