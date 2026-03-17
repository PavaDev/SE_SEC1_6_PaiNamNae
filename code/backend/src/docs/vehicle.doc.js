/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Vehicle management endpoints (for users and admins)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - vehicleModel
 *         - licensePlate
 *         - vehicleType
 *         - color
 *         - seatCapacity
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         vehicleModel:
 *           type: string
 *         licensePlate:
 *           type: string
 *         vehicleType:
 *           type: string
 *         color:
 *           type: string
 *         seatCapacity:
 *           type: integer
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *         isDefault:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     VehicleResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Vehicle'
 *
 *     VehicleListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *             pagination:
 *               $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles of the authenticated user
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleListResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle (User)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleModel
 *               - licensePlate
 *               - vehicleType
 *               - color
 *               - seatCapacity
 *             properties:
 *               vehicleModel: { type: string }
 *               licensePlate: { type: string }
 *               vehicleType: { type: string }
 *               color: { type: string }
 *               seatCapacity: { type: integer }
 *               amenities:
 *                 type: array
 *                 items: { type: string }
 *               photos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               isDefault: { type: boolean }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleResponse'
 */

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
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
 *               $ref: '#/components/schemas/VehicleResponse'
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleResponse'
 */

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @swagger
 * /api/vehicles/admin:
 *   get:
 *     summary: Get all vehicles (Admin)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleListResponse'
 */

/**
 * @swagger
 * /api/vehicles/admin/{id}:
 *   delete:
 *     summary: Delete vehicle (Admin)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
 */