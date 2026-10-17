import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/services/firebase/config';
import { UserProfile } from '@/types/hamomap';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInGuest: () => void;
  signInEmail: (e: string, p: string) => Promise<void>;
  signUpEmail: (e: string, p: string, name: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateLanguage: (lang: 'en' | 'ar') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'hamomap_guest_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check saved theme and RTL preference
    const savedTheme = localStorage.getItem('hamomap_theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedLang = localStorage.getItem('hamomap_lang') || 'en';
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');

    // Firebase Auth listener
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setUser(fbUser);
        if (fbUser) {
          setProfile({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Scholar',
            photoURL: fbUser.photoURL || undefined,
            streakDays: 4,
            lastActiveDate: new Date().toISOString(),
            totalReviews: 42,
            totalMaps: 3,
            preferredLanguage: (localStorage.getItem('hamomap_lang') as any) || 'en',
            theme: (savedTheme as any) || 'system',
          });
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Offline / Guest Mode
      const storedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
      if (storedGuest) {
        try {
          const parsed = JSON.parse(storedGuest);
          setUser({ uid: 'guest-scholar', email: parsed.email } as User);
          setProfile(parsed);
        } catch {
          signInGuest();
        }
      } else {
        signInGuest();
      }
      setLoading(false);
    }
  }, []);

  const signInGuest = () => {
    const guestProfile: UserProfile = {
      uid: 'guest-scholar',
      email: 'scholar@mindforge.ai',
      displayName: 'Guest Scholar',
      streakDays: 5,
      lastActiveDate: new Date().toISOString(),
      totalReviews: 28,
      totalMaps: 3,
      preferredLanguage: (localStorage.getItem('hamomap_lang') as any) || 'en',
      theme: 'system',
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestProfile));
    setUser({ uid: 'guest-scholar', email: 'scholar@mindforge.ai' } as User);
    setProfile(guestProfile);
  };

  const signInEmail = async (email: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      signInGuest();
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    if (isFirebaseConfigured && auth) {
      await createUserWithEmailAndPassword(auth, email, pass);
    } else {
      signInGuest();
    }
  };

  const signInGoogle = async () => {
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } else {
      signInGuest();
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setUser(null);
    setProfile(null);
  };

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    localStorage.setItem('hamomap_theme', theme);
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (profile) setProfile({ ...profile, theme });
  };

  const updateLanguage = (lang: 'en' | 'ar') => {
    localStorage.setItem('hamomap_lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    if (profile) setProfile({ ...profile, preferredLanguage: lang });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInGuest,
        signInEmail,
        signUpEmail,
        signInGoogle,
        logout,
        updateTheme,
        updateLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
