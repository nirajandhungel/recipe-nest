import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const chatApi = {
  getConversations: () => axiosInstance.get(ENDPOINTS.CHAT.CONVERSATIONS),
  getMessages: (conversationId, params) =>
    axiosInstance.get(ENDPOINTS.CHAT.MESSAGES(conversationId), { params }),
  getOrCreateConversation: (userId) =>
    axiosInstance.post(ENDPOINTS.CHAT.CONVERSATION_BY_USER(userId)),
};
