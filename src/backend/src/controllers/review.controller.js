const asyncHandler = require("express-async-handler");
const reviewService = require("../services/review.service");
const ApiError = require("../utils/ApiError");

const { uploadToCloudinary } = require('../utils/cloudinary');
const { getIO } = require('../socket');

const createReview = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const reviewData = req.body;

    if (req.files?.images) {
        const uploads = await Promise.all(
            req.files.images.map(file => uploadToCloudinary(file.buffer, 'painamnae/reviews'))
        );
        reviewData.images = uploads.map(u => u.url);
    }

    const review = await reviewService.createReview(userId, reviewData);

    // --- Socket.IO: notify driver about the new review ---
    try {
        const io = getIO();
        const driverId = review.revieweeId;
        if (driverId) {
            io.to(`user:${driverId}`).emit('notification:new', {
                id: Date.now(), // or ideally get the ID from DB
                type: 'SYSTEM',
                title: 'คุณได้รับรีวิวใหม่',
                body: `ได้รับรีวิว ${review.rating} ดาว จากผู้โดยสาร`,
                metadata: { kind: 'NEW_REVIEW', reviewId: review.id, rating: review.rating, bookingId: review.bookingId },
                createdAt: new Date().toISOString(),
            });
        }
    } catch (err) {
        console.error('Socket.IO emit error (review):', err.message);
    }

    res.status(201).json({ success: true, data: review });
});

const getGivenReviews = asyncHandler(async (req, res) => {
    let userId = req.params.userId;
    if (!userId && req.user) {
        userId = req.user.sub;
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const reviews = await reviewService.getGivenReviews(userId);
    res.status(200).json({ success: true, data: reviews });
});

const getReceivedReviews = asyncHandler(async (req, res) => {
    let userId = req.params.userId;
    if (!userId && req.user) {
        userId = req.user.sub;
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const reviews = await reviewService.getReceivedReviews(userId);
    res.status(200).json({ success: true, data: reviews });
});

const getReviewByBookingId = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const review = await reviewService.getReviewByBookingId(bookingId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    res.status(200).json({ success: true, data: review });
});

const getReviewByRouteId = asyncHandler(async (req, res) => {
    const { routeId } = req.params;
    const review = await reviewService.getReviewByRouteId(routeId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    res.status(200).json({ success: true, data: review });
});

module.exports = {
    createReview,
    getGivenReviews,
    getReceivedReviews,
    getReviewByBookingId,
    getReviewByRouteId
};
