import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants/apiEndpoints';

const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');
let socket = null;

export const connectChatSocket = (token) => {
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
  });

  return socket;
};

export const getChatSocket = () => socket;

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
