const express = require('express');
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createReviewSchema } = require('../validations/review.validation');

const router = express.Router();

// Create a review
router.post('/', protect, validate({ body: createReviewSchema }), reviewController.createReview);

// Get reviews given by a user
router.get('/given/:userId', protect, reviewController.getGivenReviews);

// Get reviews received by a user
router.get('/received/:userId', protect, reviewController.getReceivedReviews);

// Get review for a specific booking
router.get('/booking/:bookingId', protect, reviewController.getReviewByBookingId);

// Get my review for a specific route
router.get('/route/:routeId', protect, reviewController.getReviewByRouteId);

module.exports = router;
