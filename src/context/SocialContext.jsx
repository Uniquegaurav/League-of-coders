import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

const SocialContext = createContext(null);
const EMPTY = { friends: [], incoming: [], outgoing: [] };

// Friends, pending requests and battle invites, kept fresh by polling plus socket pushes.
export function SocialProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [graph, setGraph] = useState(EMPTY);
  const [invites, setInvites] = useState([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const [f, i] = await Promise.allSettled([api.friends.list(), api.friends.invites()]);
    if (f.status === 'fulfilled') setGraph({ ...EMPTY, ...f.value });
    if (i.status === 'fulfilled') setInvites(i.value.invites || []);
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setGraph(EMPTY);
      setInvites([]);
      setReady(false);
      return undefined;
    }
    reload();
    const id = setInterval(() => document.visibilityState === 'visible' && reload(), 30000);
    return () => clearInterval(id);
  }, [user, reload]);

  useEffect(() => {
    if (!user) return undefined;
    const socket = getSocket();
    const onInvite = (invite) => {
      setInvites((list) => [invite, ...list.filter((x) => x.id !== invite.id)]);
      toast(`${invite.from?.name || 'A friend'} challenged you!`, {
        description: invite.match?.name ? `Battle: ${invite.match.name}` : 'Join their lobby before it starts.',
        duration: 15000,
        action: { label: 'Join', onClick: () => navigate(`/m/${invite.match?.code}`) },
      });
    };
    const onRequest = (payload) => {
      toast(`${payload?.from?.name || 'Someone'} wants to be your friend`, { description: 'Open Community → Friends to respond.' });
      reload();
    };
    const onAccepted = (payload) => {
      toast.success(`${payload?.friend?.name || 'Your request'} accepted. You are now friends!`);
      reload();
    };
    socket.on('invite:new', onInvite);
    socket.on('friend:request', onRequest);
    socket.on('friend:accepted', onAccepted);
    return () => {
      socket.off('invite:new', onInvite);
      socket.off('friend:request', onRequest);
      socket.off('friend:accepted', onAccepted);
    };
  }, [user, reload, navigate]);

  const value = useMemo(() => {
    const relationOf = (id) => {
      if (graph.friends.some((f) => f.id === id)) return 'friend';
      if (graph.incoming.some((r) => r.from.id === id)) return 'incoming';
      if (graph.outgoing.some((r) => r.to.id === id)) return 'outgoing';
      return 'none';
    };
    const guard = async (fn, success) => {
      try {
        const res = await fn();
        if (success) toast.success(typeof success === 'function' ? success(res) : success);
        await reload();
        return res;
      } catch (err) {
        toast.error(err.message);
        return null;
      }
    };
    return {
      ready,
      ...graph,
      invites,
      onlineCount: graph.friends.filter((f) => f.online).length,
      notifications: graph.incoming.length + invites.length,
      relationOf,
      reload,
      sendRequest: (userId) =>
        guard(() => api.friends.request(userId), (r) => (r.status === 'accepted' ? 'You are now friends!' : 'Friend request sent')),
      accept: (id) => guard(() => api.friends.accept(id), 'Friend added'),
      decline: (id) => guard(() => api.friends.decline(id)),
      remove: (userId) => guard(() => api.friends.remove(userId), 'Removed from friends'),
      invite: (userId, code) => guard(() => api.friends.invite(userId, code), 'Challenge sent'),
      dismissInvite: async (id) => {
        setInvites((list) => list.filter((x) => x.id !== id));
        await api.friends.dismissInvite(id).catch(() => {});
      },
    };
  }, [graph, invites, ready, reload]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export const useSocial = () => useContext(SocialContext);
