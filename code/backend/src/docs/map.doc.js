/**
 * @swagger
 * tags:
 *   name: Maps
 *   description: External map utilities (Google Maps Directions / Geocode / Reverse-Geocode)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LatLng:
 *       type: object
 *       required: [lat, lng]
 *       properties:
 *         lat:
 *           type: number
 *           example: 16.4772
 *         lng:
 *           type: number
 *           example: 102.8141
 *
 *     DirectionsResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       summary:
 *                         type: string
 *                       distance:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                             example: "10 km"
 *                           value:
 *                             type: integer
 *                             example: 10000
 *                       duration:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                             example: "15 mins"
 *                           value:
 *                             type: integer
 *                             example: 900
 *                       overview_polyline:
 *                         type: object
 *                         properties:
 *                           points:
 *                             type: string
 *
 *     GeocodeResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               required: [lat, lng]
 *               properties:
 *                 lat:
 *                   type: number
 *                 lng:
 *                   type: number
 *                 formatted_address:
 *                   type: string
 *
 *     ReverseGeocodeResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               required: [lat, lng]
 *               properties:
 *                 lat:
 *                   type: number
 *                 lng:
 *                   type: number
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 */

/**
 * @swagger
 * /api/maps/directions:
 *   post:
 *     summary: Get driving directions between two points
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [origin, destination]
 *             properties:
 *               origin:
 *                 $ref: '#/components/schemas/LatLng'
 *               destination:
 *                 $ref: '#/components/schemas/LatLng'
 *               waypoints:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/LatLng'
 *               alternatives:
 *                 type: boolean
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *               optimizeWaypoints:
 *                 type: boolean
 *           example:
 *             origin:
 *               lat: 16.4772
 *               lng: 102.8141
 *             destination:
 *               lat: 16.4820
 *               lng: 102.8200
 *     responses:
 *       200:
 *         description: Directions fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DirectionsResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/maps/geocode:
 *   get:
 *     summary: Geocode an address into coordinates
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         example: Khon Kaen University
 *     responses:
 *       200:
 *         description: Geocode successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeocodeResponse'
 *       400:
 *         description: Invalid address
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/maps/reverse-geocode:
 *   get:
 *     summary: Reverse geocode coordinates into an address
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: string
 *         example: "16.4772"
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: string
 *         example: "102.8141"
 *     responses:
 *       200:
 *         description: Reverse geocode successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReverseGeocodeResponse'
 *       400:
 *         description: Missing coordinates
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */