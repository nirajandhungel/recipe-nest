'use strict';

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/helpers');
const { Conversation, Message } = require('../models/chat.model');

let ioInstance = null;
const onlineUsers = new Map();

const userRoom = (userId) => `user:${userId}`;

const getRecipientId = (conversation, senderId) => {
  const recipient = conversation.participants.find((participant) => participant.toString() !== senderId);
  return recipient ? recipient.toString() : null;
};

const initSocket = (httpServer, clientUrl) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization || '').replace('Bearer ', '');

    if (!token) {
      return next(new Error('Unauthorized'));
    }
    const payload = verifyAccessToken(token);
    if (!payload) {
      return next(new Error('Unauthorized'));
    }
    socket.user = payload;
    return next();
  });

  ioInstance.on('connection', (socket) => {
    const currentUserId = socket.user.userId;
    socket.join(userRoom(currentUserId));
    onlineUsers.set(currentUserId, true);
    ioInstance.emit('presence:update', { userId: currentUserId, online: true });

    // Allow user to check status of a specific user
    socket.on('presence:get', ({ userId }, ack) => {
      if (ack) ack({ online: onlineUsers.has(userId) });
    });

    socket.on('chat:send', async (payload, ack) => {
      try {
        const { conversationId, text } = payload || {};
        const cleanText = `${text || ''}`.trim();
        if (!conversationId || !cleanText) {
          if (ack) ack({ ok: false, message: 'Conversation and text are required' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (ack) ack({ ok: false, message: 'Conversation not found' });
          return;
        }
        if (!conversation.participants.some((participant) => participant.toString() === currentUserId)) {
          if (ack) ack({ ok: false, message: 'Forbidden' });
          return;
        }

        const recipientId = getRecipientId(conversation, currentUserId);
        const recipientOnline = recipientId ? onlineUsers.has(recipientId) : false;
        const now = new Date();
        const status = recipientOnline ? 'delivered' : 'sent';

        const message = await Message.create({
          conversationId,
          senderId: currentUserId,
          text: cleanText,
          status,
          ...(status === 'delivered' ? { deliveredAt: now } : {}),
        });

        const nextUnreadCounts = { ...(conversation.unreadCounts?.toObject?.() || {}) };
        if (recipientId) {
          nextUnreadCounts[recipientId] = (nextUnreadCounts[recipientId] || 0) + 1;
        }

        conversation.lastMessage = {
          text: cleanText,
          senderId: currentUserId,
          createdAt: now,
          status,
        };
        conversation.unreadCounts = nextUnreadCounts;
        conversation.updatedAt = now;
        await conversation.save();

        const populated = await Message.findById(message._id).populate(
          'senderId',
          'firstName lastName username role profileImage'
        );

        const messagePayload = {
          conversationId,
          message: populated,
        };

        ioInstance.to(userRoom(currentUserId)).emit('chat:message', messagePayload);
        if (recipientId) {
          ioInstance.to(userRoom(recipientId)).emit('chat:message', messagePayload);
        }

        ioInstance.to(userRoom(currentUserId)).emit('chat:conversation:update', {
          conversationId,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCounts[currentUserId] || 0,
        });
        if (recipientId) {
          ioInstance.to(userRoom(recipientId)).emit('chat:conversation:update', {
            conversationId,
            lastMessage: conversation.lastMessage,
            unreadCount: conversation.unreadCounts[recipientId] || 0,
          });
        }

        if (ack) ack({ ok: true, message: populated, status });
      } catch (error) {
        if (ack) ack({ ok: false, message: 'Failed to send message' });
      }
    });

    socket.on('chat:seen', async ({ conversationId }) => {
      if (!conversationId) return;
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;
      if (!conversation.participants.some((participant) => participant.toString() === currentUserId)) return;

      const now = new Date();
      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: currentUserId },
          status: { $in: ['sent', 'delivered'] },
        },
        {
          $set: { status: 'seen', seenAt: now, deliveredAt: now },
        }
      );

      const nextUnreadCounts = { ...(conversation.unreadCounts?.toObject?.() || {}) };
      nextUnreadCounts[currentUserId] = 0;
      conversation.unreadCounts = nextUnreadCounts;
      if (conversation.lastMessage?.senderId?.toString() !== currentUserId) {
        conversation.lastMessage.status = 'seen';
      }
      await conversation.save();

      const recipientId = getRecipientId(conversation, currentUserId);
      ioInstance.to(userRoom(currentUserId)).emit('chat:conversation:update', {
        conversationId,
        lastMessage: conversation.lastMessage,
        unreadCount: 0,
      });
      if (recipientId) {
        ioInstance.to(userRoom(recipientId)).emit('chat:conversation:update', {
          conversationId,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCounts[recipientId] || 0,
        });
        ioInstance.to(userRoom(recipientId)).emit('chat:seen', {
          conversationId,
          seenBy: currentUserId,
          seenAt: now,
        });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(currentUserId);
      ioInstance.emit('presence:update', { userId: currentUserId, online: false });
    });
  });

  return ioInstance;
};

const isUserOnline = (userId) => onlineUsers.has(userId);

module.exports = {
  initSocket,
  isUserOnline,
};
