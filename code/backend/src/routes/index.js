const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const vehicleRoutes = require('./vehicle.routes');
const routeRoutes = require('./route.routes');
const driverVerifRoutes = require('./driverVerification.routes');
const bookingRoutes = require('./booking.routes');
const notificationRoutes = require('./notification.routes')
const mapRoutes = require('./maps.routes')
const reviewRoutes = require('./review.routes')
const reportRoutes = require('./report.routes')
const chatRoutes = require('./chat.routes')
const webpushRoutes = require('./webpush.routes')

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/routes', routeRoutes);
router.use('/driver-verifications', driverVerifRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/reports', reportRoutes);
router.use('/api/maps', mapRoutes);
router.use('/chat', chatRoutes);
router.use('/push', webpushRoutes);

module.exports = router;