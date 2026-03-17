const express = require('express');
const { protect } = require('../middlewares/auth');
const webpushController = require('../controllers/webpush.controller');
const router = express.Router();

// POST /push/subscribe — บันทึก push subscription
router.post('/subscribe', protect, webpushController.subscribe);

// POST /push/unsubscribe — ลบ push subscription
router.post('/unsubscribe', protect, webpushController.unsubscribe);

module.exports = router;
