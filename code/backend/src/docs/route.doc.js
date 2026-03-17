/**
 * @swagger
 * tags:
 *   name: Routes
 *   description: Route management and trip matching endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required: [lat, lng]
 *       properties:
 *         lat:
 *           type: number
 *           example: 16.4772
 *         lng:
 *           type: number
 *           example: 102.8141
 *         name:
 *           type: string
 *         address:
 *           type: string
 *
 *     Route:
 *       type: object
 *       required:
 *         - id
 *         - driverId
 *         - vehicleId
 *         - startLocation
 *         - endLocation
 *         - departureTime
 *         - availableSeats
 *         - pricePerSeat
 *         - status
 *       properties:
 *         id:
 *           type: string
 *         driverId:
 *           type: string
 *         vehicleId:
 *           type: string
 *         startLocation:
 *           $ref: '#/components/schemas/Location'
 *         endLocation:
 *           $ref: '#/components/schemas/Location'
 *         waypoints:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Location'
 *         departureTime:
 *           type: string
 *           format: date-time
 *         availableSeats:
 *           type: integer
 *         pricePerSeat:
 *           type: number
 *         conditions:
 *           type: string
 *         status:
 *           type: string
 *           enum: [AVAILABLE, FULL, CANCELLED, ONGOING, COMPLETED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     RouteResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Route'
 *
 *     RouteListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
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
 *     CreateRouteRequest:
 *       type: object
 *       required: [vehicleId, startLocation, endLocation, departureTime, availableSeats, pricePerSeat]
 *       properties:
 *         vehicleId:
 *           type: string
 *         startLocation:
 *           $ref: '#/components/schemas/Location'
 *         endLocation:
 *           $ref: '#/components/schemas/Location'
 *         departureTime:
 *           type: string
 *           format: date-time
 *         availableSeats:
 *           type: integer
 *         pricePerSeat:
 *           type: number
 *         conditions:
 *           type: string
 *         waypoints:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Location'
 *         optimizeWaypoints:
 *           type: boolean
 *       example:
 *         vehicleId: "vehicle123"
 *         startLocation:
 *           lat: 16.47
 *           lng: 102.81
 *         endLocation:
 *           lat: 16.48
 *           lng: 102.82
 *         departureTime: "2026-03-17T12:00:00Z"
 *         availableSeats: 3
 *         pricePerSeat: 50
 */

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Search for available routes (Public)
 *     tags: [Routes]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RouteListResponse'
 */

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Create a new route (Driver)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRouteRequest'
 *     responses:
 *       201:
 *         description: Route created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RouteResponse'
 */

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Route retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RouteResponse'
 *       404:
 *         description: Route not found
 */