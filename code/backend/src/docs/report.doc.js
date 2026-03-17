/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Report management endpoints for users and admins
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - id
 *         - category
 *         - description
 *         - status
 *         - reporterId
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *         category:
 *           type: string
 *           enum: [vehicle_issue, passenger_issue, road_issue, safety_issue, payment_issue, no_show, other]
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, RESOLVED]
 *         reporterId:
 *           type: string
 *         targetUserId:
 *           type: string
 *         bookingId:
 *           type: string
 *         routeId:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - https://example.com/image1.jpg
 *         adminNotes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ReportResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Report'
 *
 *     ReportListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
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
 *     UpdateReportStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, RESOLVED]
 *         adminNotes:
 *           type: string
 *
 *     CreateReportRequest:
 *       type: object
 *       required: [category, description]
 *       properties:
 *         category:
 *           type: string
 *           enum: [vehicle_issue, passenger_issue, road_issue, safety_issue, payment_issue, no_show, other]
 *         description:
 *           type: string
 *         targetUserId:
 *           type: string
 *         bookingId:
 *           type: string
 *         routeId:
 *           type: string
 *       example:
 *         category: passenger_issue
 *         description: Passenger was late
 *         bookingId: booking123
 */

/**
 * @swagger
 * /api/reports/admin:
 *   get:
 *     summary: Get all reports (Admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, RESOLVED]
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/reports/admin/{id}:
 *   get:
 *     summary: Get report by ID (Admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/reports/admin/{id}:
 *   patch:
 *     summary: Update report status (Admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReportStatusRequest'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 */

/**
 * @swagger
 * /api/reports/admin/{id}:
 *   delete:
 *     summary: Delete report (Admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @swagger
 * /api/reports/me:
 *   get:
 *     summary: Get my reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateReportRequest'
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
 */