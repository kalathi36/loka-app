import { io, Socket } from 'socket.io-client';
import { getSocketBaseUrl } from './api';

let socket: Socket | null = null;
let activeToken: string | null = null;

export const connectSocket = (token: string) => {
  if (socket && activeToken === token) {
    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(getSocketBaseUrl(), {
    transports: ['websocket', 'polling'],
    upgrade: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: {
      token,
    },
  });
  activeToken = token;

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
  activeToken = null;
};

export const joinChatRoom = (partnerId: string) => {
  socket?.emit('chat:join', { partnerId });
};
