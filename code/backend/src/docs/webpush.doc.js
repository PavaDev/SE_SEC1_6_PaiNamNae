/**
 * @swagger
 * tags:
 *   name: WebPush
 *   description: Web Push notification subscription management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PushSubscription:
 *       type: object
 *       required: [endpoint, keys]
 *       properties:
 *         endpoint:
 *           type: string
 *           example: https://fcm.googleapis.com/fcm/send/abc123
 *         keys:
 *           type: object
 *           required: [p256dh, auth]
 *           properties:
 *             p256dh:
 *               type: string
 *             auth:
 *               type: string
 *
 *     UnsubscribeRequest:
 *       type: object
 *       required: [endpoint]
 *       properties:
 *         endpoint:
 *           type: string
 *
 *     PushResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               example:
 *                 subscribed: true
 */

/**
 * @swagger
 * /api/push/subscribe:
 *   post:
 *     summary: Subscribe to web push notifications
 *     tags: [WebPush]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PushSubscription'
 *     responses:
 *       200:
 *         description: Subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PushResponse'
 *       400:
 *         description: Invalid subscription data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/push/unsubscribe:
 *   post:
 *     summary: Unsubscribe from web push notifications
 *     tags: [WebPush]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnsubscribeRequest'
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PushResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */