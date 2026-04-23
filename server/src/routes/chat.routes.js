'use strict';

const { Router } = require('express');
const { ChatController } = require('../controllers/chat.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/ratelimit.middleware');

const router = Router();

router.get('/conversations', apiLimiter, authenticate, ChatController.getConversations);
router.post('/conversations/:userId', apiLimiter, authenticate, ChatController.getOrCreateConversation);
router.get('/conversations/:conversationId/messages', apiLimiter, authenticate, ChatController.getMessages);

module.exports = router;
