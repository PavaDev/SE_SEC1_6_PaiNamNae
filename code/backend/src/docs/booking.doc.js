/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         routeId:
 *           type: string
 *         passengerId:
 *           type: string
 *         driverId:
 *           type: string
 *         numberOfSeats:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, REJECTED, CANCELLED]
 *         pickupLocation:
 *           type: object
 *         dropoffLocation:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     BookingResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Booking'
 *
 *     BookingListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *
 *     CreateBookingRequest:
 *       type: object
 *       required: [routeId, numberOfSeats, pickupLocation, dropoffLocation]
 *       properties:
 *         routeId:
 *           type: string
 *         numberOfSeats:
 *           type: integer
 *         pickupLocation:
 *           type: object
 *         dropoffLocation:
 *           type: object
 *
 *     UpdateBookingStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, REJECTED, CANCELLED]
 *
 *     CancelBookingRequest:
 *       type: object
 *       required: [reason]
 *       properties:
 *         reason:
 *           type: string
 *           enum: [
 *             CHANGE_OF_PLAN,
 *             FOUND_ALTERNATIVE,
 *             DRIVER_DELAY,
 *             PRICE_ISSUE,
 *             WRONG_LOCATION,
 *             DUPLICATE_OR_WRONG_DATE,
 *             SAFETY_CONCERN,
 *             WEATHER_OR_FORCE_MAJEURE,
 *             COMMUNICATION_ISSUE
 *           ]
 *
 *     PassengerStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           example: PICKED_UP
 *
 *     NotifyArrivalRequest:
 *       type: object
 *       required: [etaMinutes]
 *       properties:
 *         etaMinutes:
 *           type: integer
 *           example: 5
 *
 *     NotifyWaitRequest:
 *       type: object
 *       required: [minutes]
 *       properties:
 *         minutes:
 *           type: integer
 *           example: 10
 */

/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: Get my bookings (Passenger)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
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
 *               $ref: '#/components/schemas/BookingResponse'
 *       404:
 *         description: Booking not found
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create booking (Passenger)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (Driver)
 *     description: Only verified drivers
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/UpdateBookingStatusRequest'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel booking (Passenger)
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/CancelBookingRequest'
 *     responses:
 *       200:
 *         description: Cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/{id}/passenger-status:
 *   patch:
 *     summary: Update passenger status (Driver)
 *     description: Only verified drivers
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/PassengerStatusRequest'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/{id}/notify-arrival:
 *   patch:
 *     summary: Notify arrival (Driver)
 *     description: Only verified drivers
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/NotifyArrivalRequest'
 *     responses:
 *       200:
 *         description: Notified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/{id}/notify-wait:
 *   patch:
 *     summary: Notify wait delay
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/NotifyWaitRequest'
 *     responses:
 *       200:
 *         description: Notified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete booking
 *     tags: [Bookings]
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
 * /api/bookings/admin:
 *   get:
 *     summary: Get all bookings (Admin)
 *     description: Admin only
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, REJECTED, CANCELLED]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */

/**
 * @swagger
 * /api/bookings/admin/{id}:
 *   get:
 *     summary: Get booking by ID (Admin)
 *     tags: [Bookings]
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
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/admin:
 *   post:
 *     summary: Create booking (Admin)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/admin/{id}:
 *   put:
 *     summary: Update booking (Admin)
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */

/**
 * @swagger
 * /api/bookings/admin/{id}:
 *   delete:
 *     summary: Delete booking (Admin)
 *     tags: [Bookings]
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

