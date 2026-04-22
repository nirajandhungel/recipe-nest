import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { tokenStorage, refreshTokenStorage, userStorage, clearAuth } from '../utils/tokenStorage';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(userStorage.get());
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setInitializing(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      const userData = data.data || data.user || data;
      setUser(userData);
      userStorage.set(userData);
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setInitializing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    const accessToken = data.data?.tokens?.accessToken || data.data?.token || data.token;
    const refreshToken = data.data?.tokens?.refreshToken;
    const userData = data.data?.user || data.user;

    tokenStorage.set(accessToken);
    if (refreshToken) refreshTokenStorage.set(refreshToken);
    userStorage.set(userData);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const { data } = await authApi.register(formData);
    // Auto-login after register: store tokens if provided
    const accessToken = data.data?.tokens?.accessToken;
    const refreshToken = data.data?.tokens?.refreshToken;
    if (accessToken) tokenStorage.set(accessToken);
    if (refreshToken) refreshTokenStorage.set(refreshToken);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // swallow — still clear local state
    } finally {
      clearAuth();
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateUserState = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    userStorage.set(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, initializing, login, register, logout, updateUserState, refetchMe: fetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};