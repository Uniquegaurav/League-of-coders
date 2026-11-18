import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api, tokenStore } from '../lib/api';
import { resetSocket } from '../lib/socket';
import { identify, resetAnalytics, track } from '../lib/analytics';
import { clearReferral, storedReferral } from '../lib/referral';
import { badgeByKey } from '../lib/badges';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());
  const seenBadges = useRef(null); // badge keys from the last user we saw; null until the first load

  // Celebrate badges earned since the last refresh (after a battle, a practice solve, a referral).
  useEffect(() => {
    if (!user) {
      seenBadges.current = null;
      return;
    }
    const keys = new Set((user.badges || []).map((b) => b.key));
    if (seenBadges.current) {
      [...keys]
        .filter((k) => !seenBadges.current.has(k))
        .forEach((k) => {
          const badge = badgeByKey.get(k);
          if (!badge) return;
          toast.success(`Badge unlocked: ${badge.name}`, { description: badge.description });
          track('badge_unlocked', { badge: k });
        });
    }
    seenBadges.current = keys;
  }, [user]);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    resetSocket();
    resetAnalytics();
  }, []);

  const acceptSession = useCallback(({ token, user: next, created }, method) => {
    tokenStore.set(token);
    setUser(next);
    resetSocket();
    identify(next);
    track(created ? 'signup_completed' : 'login', { method, referred: created ? !!storedReferral() : undefined });
    if (created) clearReferral();
    return { ...next, created: !!created };
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return null;
    try {
      const { user: me } = await api.auth.me();
      setUser(me);
      identify(me);
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
      login: async (body) => acceptSession(await api.auth.login(body), 'email'),
      register: async (body) => acceptSession(await api.auth.register({ ...body, ref: storedReferral() }), 'email'),
      googleLogin: async (credential) => acceptSession(await api.auth.google(credential, storedReferral()), 'google'),
    }),
    [user, loading, refresh, signOut, acceptSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
