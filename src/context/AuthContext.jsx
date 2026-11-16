import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';
import { resetSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    resetSocket();
  }, []);

  const acceptSession = useCallback(({ token, user: next }) => {
    tokenStore.set(token);
    setUser(next);
    resetSocket();
    return next;
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return null;
    try {
      const { user: me } = await api.auth.me();
      setUser(me);
      return me;
    } catch (err) {
      if (err.status === 401 || err.status === 404) signOut();
      return null;
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    refresh();
    const onUnauthorized = () => tokenStore.get() && signOut();
    window.addEventListener('loc:unauthorized', onUnauthorized);
    return () => window.removeEventListener('loc:unauthorized', onUnauthorized);
  }, [refresh, signOut]);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      refresh,
      signOut,
      login: async (body) => acceptSession(await api.auth.login(body)),
      register: async (body) => acceptSession(await api.auth.register(body)),
      googleLogin: async (credential) => acceptSession(await api.auth.google(credential)),
    }),
    [user, loading, refresh, signOut, acceptSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
