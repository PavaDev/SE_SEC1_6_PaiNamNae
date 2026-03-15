/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Report management endpoints for users and admins
 */

/**
 * @swagger
 * /api/reports/admin:
 *   get:
 *     summary: Get all reports (Admin only)
 *     description: ดึงข้อมูลรายงานทั้งหมดพร้อมตัวกรองและสถานะ (สำหรับแอดมิน)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by ID, title, or reporter name/email
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: ['DRIVER', 'USER', 'BOOKING', 'OTHER'] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Reports retrieved successfully with pagination
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */

/**
 * @swagger
 * /api/reports/admin/{id}:
 *   get:
 *     summary: Get report details by ID (Admin only)
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
 *         description: Report details retrieved successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */

/**
 * @swagger
 * /api/reports/admin/{id}:
 *   patch:
 *     summary: Update report status (Admin only)
 *     description: อัปเดตสถานะของรายงานและเพิ่มหมายเหตุจากแอดมิน
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
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED']
 *                 example: "APPROVED"
 *               adminNotes:
 *                 type: string
 *                 example: "ได้รับการยืนยันจากแอดมิน"
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */

/**
 * @swagger
 * /api/reports/admin/{id}:
 *   delete:
 *     summary: Delete report by ID (Admin only)
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
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */

/**
 * @swagger
 * /api/reports/me:
 *   get:
 *     summary: Get current user's own reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's submitted reports
 */

/**
 * @swagger
 * /api/reports/booking/{bookingId}:
 *   get:
 *     summary: Check if a report exists for a specific booking
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Report details if found, otherwise empty object
 */

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new report (Authenticated user)
 *     description: ผู้ใช้สามารถสร้างรายงานเพื่อแจ้งปัญหา พร้อมแนบรูปภาพได้สูงสุด 2 รูป
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [category, description]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [vehicle_issue, passenger_issue, road_issue, safety_issue, payment_issue, no_show, other]
 *                 example: "passenger_issue"
 *               description:
 *                 type: string
 *                 example: "ผู้โดยสารไม่เคารพกฎระเบียบในรถ"
 *               targetUserId:
 *                 type: string
 *                 description: ID ของผู้ที่ถูกรายงาน (optional)
 *               bookingId:
 *                 type: string
 *                 description: ID ของการจองที่เกี่ยวข้อง
 *               routeId:
 *                 type: string
 *                 description: ID ของเส้นทางที่เกี่ยวข้อง
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: ไฟล์รูปภาพแนบ (สูงสุด 2 รูป)
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get report details by ID (Authenticated user)
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
 *         description: Report details retrieved successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
