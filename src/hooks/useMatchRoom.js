import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

/**
 * Subscribes to a match room. REST loads the initial state quickly; the socket then
 * pushes every change (players, solves, status, chat, presence) in real time.
 */
export default function useMatchRoom(code, { userId } = {}) {
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(true);
  const offsetRef = useRef(0);

  const accept = useCallback((next) => {
    if (!next) return;
    offsetRef.current = next.serverNow - Date.now();
    setMatch(next);
    if (next.messages) setMessages(next.messages);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMatch(null);
    setError(null);
    api.matches
      .get(code)
      .then(({ match: m }) => !cancelled && accept(m))
      .catch((err) => !cancelled && setError(err));

    const socket = getSocket();
    const watch = () => {
      setConnected(true);
      socket.emit('match:watch', { code }, (res) => {
        if (cancelled) return;
        if (res?.error) setError(new Error(res.error));
        else accept(res.match);
      });
    };
    const onUpdate = (m) => m.code === code && accept(m);
    const onMessage = ({ code: c, message }) =>
      c === code && setMessages((prev) => (prev.some((x) => x.id === message.id) ? prev : [...prev, message].slice(-200)));
    const onPresence = ({ code: c, online: list }) => c === code && setOnline(list);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', watch);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onDisconnect);
    socket.on('match:update', onUpdate);
    socket.on('match:message', onMessage);
    socket.on('match:presence', onPresence);
    if (socket.connected) watch();

    return () => {
      cancelled = true;
      socket.emit('match:unwatch', { code });
      socket.off('connect', watch);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onDisconnect);
      socket.off('match:update', onUpdate);
      socket.off('match:message', onMessage);
      socket.off('match:presence', onPresence);
    };
    // userId: re-subscribe after sign-in so presence is attributed to the right player.
  }, [code, userId, accept]);

  const now = useCallback(() => Date.now() + offsetRef.current, []);

  const participants = match
    ? match.participants.map((p) => ({ ...p, online: online.length ? online.includes(p.id) : p.online }))
    : [];

  return { match: match && { ...match, participants }, setMatch: accept, messages, error, connected, now };
}

/** Re-renders every `ms` so countdowns stay live. */
export function useTicker(ms = 500, active = true) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms, active]);
}
