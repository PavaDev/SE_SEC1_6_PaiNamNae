/**
 * @swagger
 * tags:
 *   name: DriverVerifications
 *   description: Driver identity verification endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DriverVerification:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - licenseNumber
 *         - status
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         licenseNumber:
 *           type: string
 *         firstNameOnLicense:
 *           type: string
 *         lastNameOnLicense:
 *           type: string
 *         typeOnLicense:
 *           type: string
 *           enum: [PRIVATE_CAR_TEMPORARY, PRIVATE_CAR, PUBLIC_CAR, LIFETIME]
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         licenseIssueDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *         licenseExpiryDate:
 *           type: string
 *           format: date
 *           example: 2030-01-01
 *         licensePhotoUrl:
 *           type: string
 *           example: https://cdn.app/license.jpg
 *         selfiePhotoUrl:
 *           type: string
 *           example: https://cdn.app/selfie.jpg
 *
 *     DriverVerificationResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/DriverVerification'
 *
 *     DriverVerificationListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DriverVerification'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 100
 *
 *     UpdateVerificationStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 */

/**
 * @swagger
 * /api/driver-verifications:
 *   post:
 *     summary: Submit driver verification request (Driver)
 *     tags: [DriverVerifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - licenseNumber
 *               - firstNameOnLicense
 *               - lastNameOnLicense
 *               - typeOnLicense
 *               - licenseIssueDate
 *               - licenseExpiryDate
 *               - licensePhotoUrl
 *               - selfiePhotoUrl
 *             properties:
 *               licenseNumber:
 *                 type: string
 *               firstNameOnLicense:
 *                 type: string
 *               lastNameOnLicense:
 *                 type: string
 *               typeOnLicense:
 *                 type: string
 *                 enum: [PRIVATE_CAR_TEMPORARY, PRIVATE_CAR, PUBLIC_CAR, LIFETIME]
 *               licenseIssueDate:
 *                 type: string
 *                 format: date
 *               licenseExpiryDate:
 *                 type: string
 *                 format: date
 *               licensePhotoUrl:
 *                 type: string
 *                 format: binary
 *                 description: Driver license image file
 *               selfiePhotoUrl:
 *                 type: string
 *                 format: binary
 *                 description: Selfie image file
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverVerificationResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/driver-verifications/me:
 *   get:
 *     summary: Get my verification
 *     tags: [DriverVerifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverVerificationResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/driver-verifications/{id}:
 *   put:
 *     summary: Update my verification (Driver)
 *     tags: [DriverVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               licenseNumber:
 *                 type: string
 *               firstNameOnLicense:
 *                 type: string
 *               lastNameOnLicense:
 *                 type: string
 *               typeOnLicense:
 *                 type: string
 *               licenseIssueDate:
 *                 type: string
 *                 format: date
 *               licenseExpiryDate:
 *                 type: string
 *                 format: date
 *               licensePhotoUrl:
 *                 type: string
 *                 format: binary
 *                 description: Driver license image file
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverVerificationResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/driver-verifications/admin:
 *   get:
 *     summary: List verifications (Admin)
 *     tags: [DriverVerifications]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: typeOnLicense
 *         schema:
 *           type: string
 *           enum: [PRIVATE_CAR_TEMPORARY, PRIVATE_CAR, PUBLIC_CAR, LIFETIME]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverVerificationListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/driver-verifications/admin/{id}:
 *   get:
 *     summary: Get verification by ID (Admin)
 *     tags: [DriverVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverVerificationResponse'
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/driver-verifications/admin:
 *   post:
 *     summary: Create verification (Admin)
 *     tags: [DriverVerifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - licenseNumber
 *             properties:
 *               userId:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               firstNameOnLicense:
 *                 type: string
 *               lastNameOnLicense:
 *                 type: string
 *               typeOnLicense:
 *                 type: string
 *               licenseIssueDate:
 *                 type: string
 *                 format: date
 *               licenseExpiryDate:
 *                 type: string
 *                 format: date
 *               licensePhotoUrl:
 *                 type: string
 *                 format: binary
 *               selfiePhotoUrl:
 *                 type: string
 *                 format: binary
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverVerificationResponse'
 */

/**
 * @swagger
 * /api/driver-verifications/admin/{id}:
 *   put:
 *     summary: Update verification (Admin)
 *     tags: [DriverVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               licenseNumber:
 *                 type: string
 *               firstNameOnLicense:
 *                 type: string
 *               lastNameOnLicense:
 *                 type: string
 *               typeOnLicense:
 *                 type: string
 *               licenseIssueDate:
 *                 type: string
 *                 format: date
 *               licenseExpiryDate:
 *                 type: string
 *                 format: date
 *               licensePhotoUrl:
 *                 type: string
 *                 format: binary
 *               selfiePhotoUrl:
 *                 type: string
 *                 format: binary
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverVerificationResponse'
 */

/**
 * @swagger
 * /api/driver-verifications/admin/{id}:
 *   delete:
 *     summary: Delete verification (Admin)
 *     tags: [DriverVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */

/**
 * @swagger
 * /api/driver-verifications/{id}/status:
 *   patch:
 *     summary: Update verification status (Admin)
 *     tags: [DriverVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVerificationStatusRequest'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverVerificationResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */