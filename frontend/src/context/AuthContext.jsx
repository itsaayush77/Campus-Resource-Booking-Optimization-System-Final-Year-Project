import { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
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
        } else if (isApiUnreachable && getStoredUser()) {
          setUser(getStoredUser());
        } else {
          clearStoredAuth();
          setUser(null);
        }
      } catch {
        clearStoredAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

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
