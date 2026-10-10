import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, loginUser, logoutUser, registerUser, updateProfile } from '../services/authService';

// This module intentionally exports both the provider and its colocated hook.
/* eslint-disable react-refresh/only-export-components */
export const AuthContext = createContext(null);
export default AuthContext;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearLocalSession = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    // Remove bearer tokens created by older CareerPilot builds; sessions now use httpOnly cookies.
    try {
      localStorage.removeItem('careerpilot_token');
      localStorage.removeItem('careerpilot_user');
    } catch { /* Cookie-backed session restoration does not depend on local storage. */ }
    let active = true;
    getProfile()
      .then((profile) => { if (active) setUser(profile); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearLocalSession();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.assign('/login');
      }
    };
    window.addEventListener('careerpilot:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('careerpilot:unauthorized', handleUnauthorized);
  }, [clearLocalSession]);

  const login = useCallback(async (credentials) => {
    const response = await loginUser(credentials);
    const nextUser = response.data.user;
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await registerUser(payload);
    const nextUser = response.data.user;
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      if (error.response?.status !== 401) throw error;
      // The API has confirmed this cookie no longer authorizes a session.
    }
    clearLocalSession();
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }, [clearLocalSession]);

  const refreshUser = useCallback(async () => {
    const profile = await getProfile();
    setUser(profile);
    return profile;
  }, []);

  const saveProfile = useCallback(async (payload) => {
    const profile = await updateProfile(payload);
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(() => ({ user, loading, setUser, login, register, logout, refreshUser, saveProfile }), [
    user, loading, login, register, logout, refreshUser, saveProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
