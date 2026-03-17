/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review and rating management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - id
 *         - bookingId
 *         - reviewerId
 *         - targetUserId
 *         - rating
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *         bookingId:
 *           type: string
 *         reviewerId:
 *           type: string
 *         targetUserId:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: "Great ride!"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - https://example.com/review1.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ReviewResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Review'
 *
 *     ReviewListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *
 *     CreateReviewRequest:
 *       type: object
 *       required: [bookingId, rating, comment]
 *       properties:
 *         bookingId:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *       example:
 *         bookingId: "booking123"
 *         rating: 5
 *         comment: "Excellent service!"
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get my given reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewListResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/reviews/received:
 *   get:
 *     summary: Get my received reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewListResponse'
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateReviewRequest'
 *               - type: object
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/reviews/given/{userId}:
 *   get:
 *     summary: Get reviews given by user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /api/reviews/received/{userId}:
 *   get:
 *     summary: Get reviews received by user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /api/reviews/booking/{bookingId}:
 *   get:
 *     summary: Get review by booking
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/reviews/route/{routeId}:
 *   get:
 *     summary: Get my review for route
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */