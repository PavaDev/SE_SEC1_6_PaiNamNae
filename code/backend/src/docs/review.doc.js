/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review and rating management
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     description: ผู้ใช้ที่จองและเดินทางเสร็จสิ้นแล้วสามารถเขียนรีวิวให้คนขับได้ พร้อมแนบรูปภาพได้สูงสุด 2 รูป
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [bookingId, rating, comment]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: "cmbooking1234567890abcd"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "คนขับขับรถปอลดภัยมากครับ"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: ไฟล์รูปภาพแนบ (สูงสุด 2 รูป)
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input or already reviewed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/reviews/given/{userId}:
 *   get:
 *     summary: Get reviews given by a specific user
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
 *         description: List of reviews given by the user
 */

/**
 * @swagger
 * /api/reviews/received/{userId}:
 *   get:
 *     summary: Get reviews received by a specific user (Driver)
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
 *         description: List of reviews received by the user
 */

/**
 * @swagger
 * /api/reviews/booking/{bookingId}:
 *   get:
 *     summary: Get review for a specific booking
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
 *         description: Review details
 *       404:
 *         description: Review not found
 */

/**
 * @swagger
 * /api/reviews/route/{routeId}:
 *   get:
 *     summary: Get my review for a specific route
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
 *         description: Review details
 *       404:
 *         description: Review not found
 */
