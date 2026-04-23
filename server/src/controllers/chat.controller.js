'use strict';

const mongoose = require('mongoose');
const { Conversation, Message } = require('../models/chat.model');
const { User } = require('../models/user.model');
const { buildProfileImageMap, attachProfileImage } = require('../utils/profile-image');
const { errorResponses, sendSuccess } = require('../utils/response');
const { HTTP_STATUS } = require('../constants');
const { asyncHandler } = require('../middlewares/error.middleware');

const ensureUserInConversation = (conversation, userId) =>
  conversation.participants.some((participantId) => participantId.toString() === userId);

const toConversationPayload = (conversation, currentUserId) => {
  const obj = conversation.toObject ? conversation.toObject() : conversation;
  const otherUser = (obj.participants || []).find((participant) => participant?._id?.toString() !== currentUserId);
  return {
    ...obj,
    otherUser,
    unreadCount: obj.unreadCounts?.[currentUserId] || 0,
  };
};

class ChatController {
  static getOrCreateConversation = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponses.badRequest(res, 'Invalid user id');
    }
    if (userId === currentUserId) {
      return errorResponses.badRequest(res, 'Cannot create chat with yourself');
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return errorResponses.notFound(res, 'User not found');
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] },
    }).populate('participants', 'firstName lastName username role');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
        unreadCounts: {
          [currentUserId]: 0,
          [userId]: 0,
        },
      });
      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'firstName lastName username role'
      );
    }

    const imageMap = await buildProfileImageMap(conversation.participants.map((participant) => participant?._id));
    conversation.participants.forEach((participant) => attachProfileImage(participant, imageMap));

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      { conversation: toConversationPayload(conversation, currentUserId) },
      'Conversation ready'
    );
  });

  static getConversations = asyncHandler(async (req, res) => {
    const currentUserId = req.user.userId;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate('participants', 'firstName lastName username role')
      .sort({ updatedAt: -1 })
      .limit(50);

    const participantIds = conversations.flatMap((conversation) => conversation.participants.map((p) => p?._id));
    const imageMap = await buildProfileImageMap(participantIds);
    conversations.forEach((conversation) => {
      conversation.participants.forEach((participant) => attachProfileImage(participant, imageMap));
    });

    const payload = conversations.map((conversation) => toConversationPayload(conversation, currentUserId));

    return sendSuccess(res, HTTP_STATUS.OK, { conversations: payload }, 'Conversations fetched');
  });

  static getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { before, limit = 30 } = req.query;
    const currentUserId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return errorResponses.badRequest(res, 'Invalid conversation id');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !ensureUserInConversation(conversation, currentUserId)) {
      return errorResponses.notFound(res, 'Conversation not found');
    }

    const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
    const query = { conversationId };
    if (before && mongoose.Types.ObjectId.isValid(before)) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'firstName lastName username role')
      .sort({ _id: -1 })
      .limit(safeLimit);

    const senderMap = await buildProfileImageMap(messages.map((message) => message.senderId?._id));
    messages.forEach((message) => attachProfileImage(message.senderId, senderMap));

    const ordered = messages.reverse();
    const nextCursor = ordered.length ? ordered[0]._id : null;

    return sendSuccess(res, HTTP_STATUS.OK, { messages: ordered, nextCursor }, 'Messages fetched');
  });
}

module.exports = { ChatController };
