import { io } from 'socket.io-client';
import { API_URL, tokenStore } from './api';

let socket = null;

// One shared connection; the token is re-read on every (re)connect so sign-in/out is picked up.
export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: tokenStore.get() }),
    });
  }
  return socket;
}

export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
