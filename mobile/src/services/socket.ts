import { io, Socket } from 'socket.io-client';
import { getSocketBaseUrl } from './api';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(getSocketBaseUrl(), {
    transports: ['websocket'],
    autoConnect: true,
    auth: {
      token,
    },
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
};

export const joinChatRoom = (partnerId: string) => {
  socket?.emit('chat:join', { partnerId });
};
