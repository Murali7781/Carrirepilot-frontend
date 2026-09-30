import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProfile, loginUser, registerUser, updateProfile } from '../services/authService';
import AuthContext from './contextValue';

function readStoredUser() {
  try {
    const stored = localStorage.getItem('careerpilot_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem('careerpilot_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('careerpilot_token'));
  const [loading, setLoading] = useState(true);
  const skipNextBootstrap = useRef(false);

  const logout = (skipRedirect = false) => {
    localStorage.removeItem('careerpilot_token');
    localStorage.removeItem('careerpilot_user');
    setToken(null);
    setUser(null);

    if (!skipRedirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (skipNextBootstrap.current) {
        skipNextBootstrap.current = false;
        setLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
        localStorage.setItem('careerpilot_user', JSON.stringify(profile));
      } catch {
        logout(true);
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, [token]);

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    const nextToken = response.data.token;
    const nextUser = response.data.user;

    localStorage.setItem('careerpilot_token', nextToken);
    localStorage.setItem('careerpilot_user', JSON.stringify(nextUser));
    skipNextBootstrap.current = true;
    setToken(nextToken);
    setUser(nextUser);

    return response;
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    return response;
  };

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const profile = await getProfile();
    setUser(profile);
    localStorage.setItem('careerpilot_user', JSON.stringify(profile));
    return profile;
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => logout(true);
    window.addEventListener('careerpilot:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('careerpilot:unauthorized', handleUnauthorized);
  }, []);

  const saveProfile = async (payload) => {
    const profile = await updateProfile(payload);
    setUser(profile);
    localStorage.setItem('careerpilot_user', JSON.stringify(profile));
    return profile;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      setUser,
      login,
      register,
      logout,
      refreshUser,
      saveProfile,
    }),
    [user, token, loading, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
