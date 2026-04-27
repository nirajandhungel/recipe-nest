'use strict';

// Import Socket.IO server class
const { Server } = require('socket.io');

// Helper function to verify JWT access token
const { verifyAccessToken } = require('../utils/helpers');

// Import MongoDB models for chat
const { Conversation, Message } = require('../models/chat.model');

// Store Socket.IO instance globally
let ioInstance = null;

// Map to track currently online users
// Format: Map<userId, true>
const onlineUsers = new Map();

// Helper function to generate a unique room name for each user
// Example: user:123
const userRoom = (userId) => `user:${userId}`;

// Helper function to find recipient in a 2-person conversation
// It returns the participant who is NOT the sender
const getRecipientId = (conversation, senderId) => {
  const recipient = conversation.participants.find(
    (participant) => participant.toString() !== senderId
  );

  return recipient ? recipient.toString() : null;
};

// Initialize Socket.IO server
const initSocket = (httpServer, clientUrl) => {

  // Create Socket.IO server with CORS configuration
  ioInstance = new Server(httpServer, {
    cors: {
      origin: clientUrl, // Allow frontend origin
      credentials: true, // Allow cookies/auth headers
    },
  });

  // Middleware to authenticate socket connection using JWT
  ioInstance.use((socket, next) => {

    // Get token from auth or authorization header
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization || '')
        .replace('Bearer ', '');

    // Reject if token missing
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    // Verify JWT token
    const payload = verifyAccessToken(token);

    // Reject if token invalid
    if (!payload) {
      return next(new Error('Unauthorized'));
    }

    // Attach decoded user info to socket
    socket.user = payload;

    // Allow connection
    return next();
  });

  // Handle new client connection
  ioInstance.on('connection', (socket) => {

    // Get current user's ID from token payload
    const currentUserId = socket.user.userId;

    // Join user's personal room
    socket.join(userRoom(currentUserId));

    // Mark user as online
    onlineUsers.set(currentUserId, true);

    // Notify all users that this user is online
    ioInstance.emit('presence:update', {
      userId: currentUserId,
      online: true
    });

    // -----------------------------------------
    // PRESENCE CHECK EVENT
    // -----------------------------------------

    // Allows client to check if another user is online
    socket.on('presence:get', ({ userId }, ack) => {

      // Send online status using acknowledgment callback
      if (ack) {
        ack({ online: onlineUsers.has(userId) });
      }
    });

    // -----------------------------------------
    // SEND MESSAGE EVENT
    // -----------------------------------------

    socket.on('chat:send', async (payload, ack) => {

      try {

        // Extract conversation ID and message text
        const { conversationId, text } = payload || {};

        // Clean text (remove extra spaces)
        const cleanText = `${text || ''}`.trim();

        // Validate required fields
        if (!conversationId || !cleanText) {

          if (ack) {
            ack({
              ok: false,
              message: 'Conversation and text are required'
            });
          }

          return;
        }

        // Find conversation in database
        const conversation =
          await Conversation.findById(conversationId);

        // If conversation doesn't exist
        if (!conversation) {

          if (ack) {
            ack({
              ok: false,
              message: 'Conversation not found'
            });
          }

          return;
        }

        // Security check:
        // Ensure sender is part of the conversation
        if (!conversation.participants.some(
          (participant) =>
            participant.toString() === currentUserId
        )) {

          if (ack) {
            ack({
              ok: false,
              message: 'Forbidden'
            });
          }

          return;
        }

        // Get recipient ID
        const recipientId =
          getRecipientId(conversation, currentUserId);

        // Check if recipient is online
        const recipientOnline =
          recipientId
            ? onlineUsers.has(recipientId)
            : false;

        const now = new Date();

        // Set message status
        // delivered if recipient online
        // sent if offline
        const status =
          recipientOnline
            ? 'delivered'
            : 'sent';

        // Save message in database
        const message = await Message.create({
          conversationId,
          senderId: currentUserId,
          text: cleanText,
          status,

          // Add delivered time only if delivered
          ...(status === 'delivered'
            ? { deliveredAt: now }
            : {}),
        });

        // -----------------------------------------
        // UPDATE UNREAD COUNTS
        // -----------------------------------------

        // Copy existing unread counts
        const nextUnreadCounts = {
          ...(conversation.unreadCounts?.toObject?.() || {})
        };

        // Increase recipient unread count
        if (recipientId) {
          nextUnreadCounts[recipientId] =
            (nextUnreadCounts[recipientId] || 0) + 1;
        }

        // Update conversation last message
        conversation.lastMessage = {
          text: cleanText,
          senderId: currentUserId,
          createdAt: now,
          status,
        };

        // Update unread counts
        conversation.unreadCounts = nextUnreadCounts;

        // Update timestamp
        conversation.updatedAt = now;

        // Save conversation
        await conversation.save();

        // Populate sender info
        const populated =
          await Message.findById(message._id)
            .populate(
              'senderId',
              'firstName lastName username role profileImage'
            );

        // Create payload for clients
        const messagePayload = {
          conversationId,
          message: populated,
        };

        // Send message to sender
        ioInstance
          .to(userRoom(currentUserId))
          .emit('chat:message', messagePayload);

        // Send message to recipient
        if (recipientId) {
          ioInstance
            .to(userRoom(recipientId))
            .emit('chat:message', messagePayload);
        }

        // -----------------------------------------
        // UPDATE CONVERSATION LIST
        // -----------------------------------------

        // Update sender conversation list
        ioInstance
          .to(userRoom(currentUserId))
          .emit('chat:conversation:update', {
            conversationId,
            lastMessage: conversation.lastMessage,
            unreadCount:
              conversation.unreadCounts[currentUserId] || 0,
          });

        // Update recipient conversation list
        if (recipientId) {

          ioInstance
            .to(userRoom(recipientId))
            .emit('chat:conversation:update', {
              conversationId,
              lastMessage: conversation.lastMessage,
              unreadCount:
                conversation.unreadCounts[recipientId] || 0,
            });
        }

        // Send acknowledgment to sender
        if (ack) {
          ack({
            ok: true,
            message: populated,
            status
          });
        }

      } catch (error) {

        // Handle error
        if (ack) {
          ack({
            ok: false,
            message: 'Failed to send message'
          });
        }
      }
    });

    // -----------------------------------------
    // SEEN MESSAGE EVENT
    // -----------------------------------------

    socket.on('chat:seen', async ({ conversationId }) => {

      // Validate conversation
      if (!conversationId) return;

      const conversation =
        await Conversation.findById(conversationId);

      if (!conversation) return;

      // Ensure user belongs to conversation
      if (!conversation.participants.some(
        (participant) =>
          participant.toString() === currentUserId
      )) return;

      const now = new Date();

      // Mark all received messages as seen
      await Message.updateMany(
        {
          conversationId,

          // Messages not sent by current user
          senderId: { $ne: currentUserId },

          // Only update sent/delivered messages
          status: { $in: ['sent', 'delivered'] },
        },
        {
          $set: {
            status: 'seen',
            seenAt: now,
            deliveredAt: now,
          },
        }
      );

      // Reset unread count
      const nextUnreadCounts = {
        ...(conversation.unreadCounts?.toObject?.() || {})
      };

      nextUnreadCounts[currentUserId] = 0;

      conversation.unreadCounts = nextUnreadCounts;

      // Update last message status if needed
      if (
        conversation.lastMessage?.senderId?.toString()
        !== currentUserId
      ) {
        conversation.lastMessage.status = 'seen';
      }

      await conversation.save();

      // Get recipient
      const recipientId =
        getRecipientId(conversation, currentUserId);

      // Update sender UI
      ioInstance
        .to(userRoom(currentUserId))
        .emit('chat:conversation:update', {
          conversationId,
          lastMessage: conversation.lastMessage,
          unreadCount: 0,
        });

      // Notify recipient
      if (recipientId) {

        ioInstance
          .to(userRoom(recipientId))
          .emit('chat:conversation:update', {
            conversationId,
            lastMessage: conversation.lastMessage,
            unreadCount:
              conversation.unreadCounts[recipientId] || 0,
          });

        // Send seen notification
        ioInstance
          .to(userRoom(recipientId))
          .emit('chat:seen', {
            conversationId,
            seenBy: currentUserId,
            seenAt: now,
          });
      }
    });

    // -----------------------------------------
    // DISCONNECT EVENT
    // -----------------------------------------

    socket.on('disconnect', () => {

      // Remove user from online list
      onlineUsers.delete(currentUserId);

      // Notify all users that user is offline
      ioInstance.emit('presence:update', {
        userId: currentUserId,
        online: false
      });
    });
  });

  return ioInstance;
};

// Helper function to check if user is online
const isUserOnline = (userId) =>
  onlineUsers.has(userId);

// Export functions
module.exports = {
  initSocket,
  isUserOnline,
};