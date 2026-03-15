const express = require('express');
const { protect } = require('../middlewares/auth');
const chatController = require('../controllers/chat.controller');
const router = express.Router();

// GET /chat/routes/:routeId/messages — ดึงประวัติ chat
router.get('/routes/:routeId/messages', protect, chatController.getMessages);

// POST /chat/routes/:routeId/messages — ส่ง message
router.post('/routes/:routeId/messages', protect, chatController.sendMessage);

module.exports = router;
