import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants/apiEndpoints';

const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');
let socket = null;

export const connectChatSocket = (token) => {
  if (!token) return null;
  if (socket?.connected) return socket; //already connected return existing socket

  socket = io(SOCKET_URL, {
    transports: ['websocket'], //forces websocket only, no long polling
    auth: { token },
  });

  return socket; // now components csn use socket.emit and socket.on
};

export const getChatSocket = () => socket;//Current active socket

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
