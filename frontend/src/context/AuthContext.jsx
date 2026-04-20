import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCurrentUser, logout as apiLogout } from '../api/authApi';
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  setStoredUser,
} from '../utils/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async ({ allowFallback = false } = {}) => {
    const token = getStoredToken();
    if (!token) {
      clearStoredAuth();
      setUser(null);
      return null;
    }

    try {
      const data = await getCurrentUser();
      const isApiUnreachable =
        typeof data?.message === 'string' &&
        (data.message.includes('Cannot reach the API') ||
          data.message.includes('API proxy/gateway error'));

      if (data.success && data.user) {
        setUser(data.user);
        setStoredUser(data.user);
        return data.user;
      }

      if (allowFallback && isApiUnreachable && getStoredUser()) {
        const storedUser = getStoredUser();
        setUser(storedUser);
        return storedUser;
      }

      clearStoredAuth();
      setUser(null);
      return null;
    } catch {
      clearStoredAuth();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      await refreshUser({ allowFallback: true });
      setLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return undefined;

    const refreshSilently = () => {
      refreshUser({ allowFallback: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSilently();
      }
    };

    const interval = window.setInterval(refreshSilently, 60000);
    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshUser, user]);

  const login = (userData, token) => {
    setStoredAuth(userData, token);
    setUser(userData);
  };

  const updateUser = (nextUser) => {
    setUser((current) => {
      const mergedUser = {
        ...(current || {}),
        ...(nextUser || {}),
      };

      setStoredUser(mergedUser);
      return mergedUser;
    });
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore logout errors
    }

    clearStoredAuth();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    updateUser,
    refreshUser,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
