import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../api/apiClient';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [initializing, setInitializing] = useState(true);
  const [mode, setMode] = useState('anonymous'); // 'anonymous' | 'guest' | 'user' | 'admin'
  const [user, setUser] = useState(null);
  const [guestInfo, setGuestInfo] = useState(null);

  const restoreSession = useCallback(async () => {
    try {
      const savedUserToken = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (savedUserToken) {
        const cachedUserRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        const cachedUser = cachedUserRaw ? JSON.parse(cachedUserRaw) : null;
        const profile = (await authApi.getProfile()) || cachedUser;
        if (!profile) throw new Error('Sesión inválida');
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(profile));
        setUser(profile);
        setMode(profile?.role?.name === 'Admin' || profile?.roleId === 3 ? 'admin' : 'user');
        return;
      }

      const savedGuestToken = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
      if (savedGuestToken) {
        const status = await authApi.getGuestSession(savedGuestToken);
        const fullGuest = { ...status, token: savedGuestToken };
        await AsyncStorage.setItem(STORAGE_KEYS.GUEST_INFO, JSON.stringify(fullGuest));
        setGuestInfo(fullGuest);
        setMode('guest');
        return;
      }
    } catch {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.GUEST_TOKEN,
        STORAGE_KEYS.GUEST_INFO
      ]);
      setUser(null);
      setGuestInfo(null);
      setMode('anonymous');
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const startGuestSession = async () => {
    const data = await authApi.createGuestSession();
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER_TOKEN, STORAGE_KEYS.USER_DATA]);
    await AsyncStorage.setItem(STORAGE_KEYS.GUEST_TOKEN, data.token);
    await AsyncStorage.setItem(STORAGE_KEYS.GUEST_INFO, JSON.stringify(data));
    setUser(null);
    setGuestInfo(data);
    setMode('guest');
    return data;
  };

  const refreshGuestStatus = async (updatedGuestBlock) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
    if (!token) return;
    if (updatedGuestBlock) {
      const merged = { ...updatedGuestBlock, token };
      setGuestInfo(merged);
      await AsyncStorage.setItem(STORAGE_KEYS.GUEST_INFO, JSON.stringify(merged));
      return;
    }
    try {
      const status = await authApi.getGuestSession(token);
      const merged = { ...status, token };
      setGuestInfo(merged);
      await AsyncStorage.setItem(STORAGE_KEYS.GUEST_INFO, JSON.stringify(merged));
    } catch {
      // ignore
    }
  };

  const login = async (email, password, { migrateCurrentGuest = false } = {}) => {
    const pendingGuestToken = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
    const res = await authApi.login(email, password);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, res.token);

    let migrationResult = null;
    if (migrateCurrentGuest && pendingGuestToken) {
      try {
        migrationResult = await authApi.migrateGuest(pendingGuestToken);
      } catch (err) {
        migrationResult = { error: err.message };
      }
    }

    await AsyncStorage.multiRemove([STORAGE_KEYS.GUEST_TOKEN, STORAGE_KEYS.GUEST_INFO]);
    const fetchedProfile = await authApi.getProfile();
    const profile = fetchedProfile || res.user;
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(profile));

    setGuestInfo(null);
    setUser(profile);
    const isAdminUser = profile?.role?.name === 'Admin' || profile?.roleId === 3;
    setMode(isAdminUser ? 'admin' : 'user');
    return { profile, migrationResult };
  };

  const registerAndLogin = async ({ userName, email, password, phone, migrateCurrentGuest = true }) => {
    await authApi.register({ userName, email, password, phone });
    return login(email, password, { migrateCurrentGuest });
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.GUEST_TOKEN,
      STORAGE_KEYS.GUEST_INFO
    ]);
    setUser(null);
    setGuestInfo(null);
    setMode('anonymous');
  };

  return (
    <AuthContext.Provider
      value={{
        initializing,
        mode,
        isAuthenticated: mode === 'user' || mode === 'admin',
        isAdmin: mode === 'admin',
        isGuest: mode === 'guest',
        user,
        guestInfo,
        setUser,
        startGuestSession,
        refreshGuestStatus,
        login,
        registerAndLogin,
        logout,
        restoreSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);