const asyncHandler = require('express-async-handler');
const { saveSubscription, deleteSubscription } = require('../services/webpush.service');

const subscribe = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const subscription = req.body;
    const data = await saveSubscription(userId, subscription);
    res.status(201).json({ success: true, data });
});

const unsubscribe = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { endpoint } = req.body;
    await deleteSubscription(userId, endpoint);
    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
});

module.exports = { subscribe, unsubscribe };
