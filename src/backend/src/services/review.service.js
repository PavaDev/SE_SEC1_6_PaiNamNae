const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { BookingStatus, RouteStatus } = require('@prisma/client');

/**
 * Create a new review
 * @param {string} userId - ID of the user creating the review (reviewer)
 * @param {Object} data - Review data
 * @returns {Promise<Object>} Created review
 */
const createReview = async (userId, data) => {
    const { bookingId, rating, comment, images = null } = data;

    return prisma.$transaction(async (tx) => {
        // 1. Validate Booking
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: {
                route: true,
                review: true
            }
        });

        if (!booking) {
            throw new ApiError(404, 'Booking not found');
        }

        // 2. Validate Reviewer
        // The reviewer must be the passenger of the booking
        if (booking.passengerId !== userId) {
            throw new ApiError(403, 'You are not authorized to review this booking');
        }

        // 3. Validate Booking Status & Route Status
        // Booking must be CONFIRMED and Route should be COMPLETED
        if (booking.status !== BookingStatus.CONFIRMED) {
            throw new ApiError(400, 'Only confirmed bookings can be reviewed');
        }

        if (booking.route.status !== RouteStatus.COMPLETED) {
            throw new ApiError(400, 'Cannot review a trip that is not completed');
        }

        // 4. Check if review already exists
        if (booking.review) {
            throw new ApiError(400, 'You have already reviewed this booking');
        }

        // 5. Determine Reviewee (Driver)
        const revieweeId = booking.route.driverId;

        // 6. Create Review
        const review = await tx.review.create({
            data: {
                bookingId,
                reviewerId: userId,
                revieweeId,
                rating,
                comment,
                images
            }
        });

        // 7. Update Reviewee's Rating Stats
        // Recalculate average rating for the driver
        const aggregate = await tx.review.aggregate({
            where: { revieweeId },
            _avg: { rating: true },
            _count: { rating: true }
        });

        await tx.user.update({
            where: { id: revieweeId },
            data: {
                ratingAverage: aggregate._avg.rating || 0,
                ratingCount: aggregate._count.rating || 0
            }
        });

        return review;
    });
};

/**
 * Get reviews given by a user
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
const getGivenReviews = async (userId) => {
    return prisma.review.findMany({
        where: { reviewerId: userId },
        include: {
            reviewee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profilePicture: true
                }
            },
            booking: {
                include: {
                    route: {
                        select: {
                            startLocation: true,
                            endLocation: true,
                            departureTime: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Get reviews received by a user
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
const getReceivedReviews = async (userId) => {
    return prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
            reviewer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profilePicture: true
                }
            },
            booking: {
                include: {
                    route: {
                        select: {
                            startLocation: true,
                            endLocation: true,
                            departureTime: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Get review for a specific booking
 * @param {string} bookingId 
 * @returns {Promise<Object>}
 */
const getReviewByBookingId = async (bookingId) => {
    return prisma.review.findUnique({
        where: { bookingId },
        include: {
            reviewer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profilePicture: true
                }
            }
        }
    });
};

const getReviewByRouteId = async (routeId) => {
    const reviews = await prisma.review.findMany({
        where: {
            booking: {
                routeId: routeId
            }
        },
        include: {
            reviewer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    profilePicture: true
                }
            }
        }
    })

    if (!reviews) {
        return null;
    }

    return reviews;
};

module.exports = {
    createReview,
    getGivenReviews,
    getReceivedReviews,
    getReviewByBookingId,
    getReviewByRouteId
};
