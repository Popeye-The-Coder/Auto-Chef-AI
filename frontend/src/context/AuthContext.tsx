import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserProfile } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('autochef_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const storedToken = localStorage.getItem('autochef_token');
      if (storedToken) {
        setToken(storedToken);
        const me = await authService.getMe();
        setUser(me);
        const prof = await authService.getProfile();
        setProfile(prof);
      } else {
        // Fallback for seamless demo testing: fetch demo profile
        try {
          const prof = await authService.getProfile();
          setProfile(prof);
          setUser({
            id: 1,
            email: 'demo@autochef.com',
            full_name: 'Alex Rivera (Demo)',
            is_active: true,
            is_superuser: true,
            created_at: new Date().toISOString()
          });
        } catch {
          // not logged in
        }
      }
    } catch (e) {
      console.warn('Auth init note:', e);
      localStorage.removeItem('autochef_token');
      setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    localStorage.setItem('autochef_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    const prof = await authService.getProfile();
    setProfile(prof);
  };

  const register = async (email: string, pass: string, name?: string) => {
    const data = await authService.register(email, pass, name);
    localStorage.setItem('autochef_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    const prof = await authService.getProfile();
    setProfile(prof);
  };

  const logout = () => {
    localStorage.removeItem('autochef_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const prof = await authService.getProfile();
      setProfile(prof);
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
