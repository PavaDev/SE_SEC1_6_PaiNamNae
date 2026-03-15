const { z } = require('zod');

const createReviewSchema = z.object({
    bookingId: z.string().cuid({ message: 'Invalid booking ID format' }),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().optional(),
    images: z.any().optional(), // Allow any type for now (likely array or object), optional
});

module.exports = {
    createReviewSchema,
};
