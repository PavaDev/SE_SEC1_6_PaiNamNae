const asyncHandler = require('express-async-handler');
const chatService = require('../services/chat.service');

const getMessages = asyncHandler(async (req, res) => {
    const { routeId } = req.params;
    const userId = req.user.sub;
    const data = await chatService.getMessages(routeId, userId);
    res.status(200).json({ success: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
    const { routeId } = req.params;
    const userId = req.user.sub;
    const { text } = req.body;
    const data = await chatService.sendMessage(routeId, userId, text.trim());
    res.status(201).json({ success: true, data });
});

module.exports = { getMessages, sendMessage };
