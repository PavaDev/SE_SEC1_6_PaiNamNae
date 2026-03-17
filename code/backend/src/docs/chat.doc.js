/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat messaging between users in a route
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         routeId:
 *           type: string
 *         senderId:
 *           type: string
 *         message:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ChatMessageResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/ChatMessage'
 *
 *     ChatMessageListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *
 *     SendMessageRequest:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *           example: Hello, I’m on my way!
 */

/**
 * @swagger
 * /api/chat/routes/{routeId}/messages:
 *   get:
 *     summary: Get chat messages for a route
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessageListResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/chat/routes/{routeId}/messages:
 *   post:
 *     summary: Send a message in a route chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessageResponse'
 *       401:
 *         description: Unauthorized
 */