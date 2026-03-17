/**
 * @swagger
 * info:
 *   title: Ride Sharing API
 *   version: 1.0.0
 *   description: API documentation for ride-sharing system
 *
 * servers:
 *   - url: http://localhost:3000/api
 *     description: Local server
 *
 * tags:
 *   - name: System
 *     description: System and health check
 *   - name: Auth
 *     description: Authentication endpoints
 *   - name: Users
 *     description: User management
 *   - name: Vehicles
 *     description: Vehicle management
 *   - name: Routes
 *     description: Trip routes management
 *   - name: DriverVerifications
 *     description: Driver identity verification
 *   - name: Bookings
 *     description: Booking system
 *   - name: Notifications
 *     description: Notification system
 *   - name: Reviews
 *     description: Reviews and ratings
 *   - name: Reports
 *     description: Report and complaint system
 *   - name: Maps
 *     description: Map and geolocation services
 *   - name: Chat
 *     description: Chat messaging
 *   - name: WebPush
 *     description: Web push notifications
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API root (health check)
 *     description: ตรวจสอบว่า API ทำงานปกติ
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: API is running
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/routes-info:
 *   get:
 *     summary: API routes overview
 *     description: แสดงรายการ endpoint หลักของระบบ (สำหรับ documentation)
 *     tags: [System]
 *     responses:
 *       200:
 *         description: List of available route groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: string
 *             example:
 *               routes:
 *                 - /api/auth
 *                 - /api/users
 *                 - /api/vehicles
 *                 - /api/routes
 *                 - /api/driver-verifications
 *                 - /api/bookings
 *                 - /api/notifications
 *                 - /api/reviews
 *                 - /api/reports
 *                 - /api/maps
 *                 - /api/chat
 *                 - /api/push
 *       500:
 *         description: Internal server error
 */