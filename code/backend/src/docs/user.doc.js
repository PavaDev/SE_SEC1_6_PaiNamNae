/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (public, authenticated, and admin)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - username
 *         - role
 *         - isActive
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         username:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         gender:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, DRIVER, PASSENGER]
 *         isActive:
 *           type: boolean
 *         isVerified:
 *           type: boolean
 *         profilePicture:
 *           type: string
 *         ratingAverage:
 *           type: number
 *         ratingCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     UserResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/User'
 *
 *     UserListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
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
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - email
 *         - username
 *         - password
 *         - firstName
 *         - lastName
 *         - phoneNumber
 *         - gender
 *         - nationalIdNumber
 *         - nationalIdExpiryDate
 *       properties:
 *         email:
 *           type: string
 *         username:
 *           type: string
 *         password:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         gender:
 *           type: string
 *         nationalIdNumber:
 *           type: string
 *         nationalIdExpiryDate:
 *           type: string
 *           format: date
 *       example:
 *         email: test@mail.com
 *         username: user123
 *         password: 123456
 *         firstName: John
 *         lastName: Doe
 *         phoneNumber: "0812345678"
 *         gender: male
 *
 *     UpdateUserStatusRequest:
 *       type: object
 *       required: [isActive]
 *       properties:
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateUserRequest'
 *               - type: object
 *                 properties:
 *                   nationalIdPhotoUrl:
 *                     type: string
 *                     format: binary
 *                   selfiePhotoUrl:
 *                     type: string
 *                     format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update my profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               username: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phoneNumber: { type: string }
 *               gender: { type: string }
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *               nationalIdPhotoUrl:
 *                 type: string
 *                 format: binary
 *               selfiePhotoUrl:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get public user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/users/admin:
 *   get:
 *     summary: Get all users (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/users/admin/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserStatusRequest'
 *     responses:
 *       200:
 *         description: Status updated
 */