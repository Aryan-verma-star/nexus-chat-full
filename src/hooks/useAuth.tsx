import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getStoredUser, isAuthenticated } from '@/lib/api';
import { User } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    // First check if we have a stored user - use it while API call is pending
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    
    // If not authenticated, we're done
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    // Try to refresh from API
    try {
      const data = await api.auth.me();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
      }
    } catch (err: any) {
      // If API fails but we have stored user, keep them logged in
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      } else {
        setUser(null);
        localStorage.removeItem('nexus_access_token');
        localStorage.removeItem('nexus_user');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      localStorage.removeItem('nexus_access_token');
      localStorage.removeItem('nexus_refresh_token');
      localStorage.removeItem('nexus_user');
    }
  };

  const setUserDirect = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('nexus_user', JSON.stringify(newUser));
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout, setUser: setUserDirect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
