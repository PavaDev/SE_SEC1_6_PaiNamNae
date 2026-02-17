/**
 * ============================================================
 * FUNCTIONAL TESTS — Report Feature
 * ============================================================
 * Test Level  : Functional
 * File        : tests/backend/functional/report.functional.test.js
 * Purpose     : Test report API behavior end-to-end via HTTP.
 *               Validates request/response structure, status codes,
 *               and error messages for both positive and negative
 *               scenarios using Supertest against the Express app.
 * ============================================================
 */

// --------------- Mock External Dependencies ---------------

// Mock Prisma
const mockReportCreate = jest.fn();
const mockReportFindUnique = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportUpdate = jest.fn();
const mockReportDelete = jest.fn();
const mockReportCount = jest.fn();
const mockQueryRaw = jest.fn().mockResolvedValue([1]);

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $queryRaw: mockQueryRaw,
    report: {
        create: mockReportCreate,
        findUnique: mockReportFindUnique,
        findFirst: mockReportFindFirst,
        findMany: mockReportFindMany,
        update: mockReportUpdate,
        delete: mockReportDelete,
        count: mockReportCount,
    },
}));

// Mock Cloudinary
jest.mock('../../../src/backend/src/utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/painamnae/reports/mock-evidence.jpg',
        public_id: 'painamnae/reports/mock-evidence',
    }),
    deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

// Mock JWT verification
jest.mock('../../../src/backend/src/utils/jwt', () => ({
    verifyToken: jest.fn((token) => {
        if (token === 'valid-passenger-token') {
            return { sub: 'passenger-001', role: 'PASSENGER' };
        }
        if (token === 'valid-admin-token') {
            return { sub: 'admin-001', role: 'ADMIN' };
        }
        if (token === 'valid-driver-token') {
            return { sub: 'driver-001', role: 'DRIVER' };
        }
        throw new Error('Invalid token');
    }),
    generateToken: jest.fn(),
}));

// Mock ensureAdmin bootstrap
jest.mock('../../../src/backend/src/bootstrap/ensureAdmin', () => jest.fn().mockResolvedValue());

const request = require('supertest');

// --------------- Build Express App (without starting the server) ---------------

let app;

beforeAll(() => {
    const express = require('express');
    const cors = require('cors');
    const routes = require('../../../src/backend/src/routes');
    const { errorHandler } = require('../../../src/backend/src/middlewares/errorHandler');
    const ApiError = require('../../../src/backend/src/utils/ApiError');

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', routes);

    // 404 handler
    app.use((req, res, next) => {
        next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
    });

    app.use(errorHandler);
});

// --------------- Test Data ---------------

const mockReport = {
    id: 'report-func-001',
    reporterId: 'passenger-001',
    type: 'DRIVER',
    category: 'SAFETY_ISSUE',
    description: 'Driver was speeding and using phone',
    images: null,
    status: 'PENDING',
    adminNotes: null,
    routeId: 'route-001',
    bookingId: 'booking-001',
    targetUserId: 'driver-001',
    resolvedAt: null,
    resolvedById: null,
    createdAt: new Date().toISOString(),
    reporter: {
        id: 'passenger-001',
        firstName: 'Jane',
        lastName: 'Passenger',
        email: 'jane@example.com',
        profilePicture: null,
    },
    targetUser: {
        id: 'driver-001',
        firstName: 'John',
        lastName: 'Driver',
        email: 'john@example.com',
        profilePicture: null,
    },
    route: {
        id: 'route-001',
        startLocation: { name: 'CentralWorld' },
        endLocation: { name: 'Siam Paragon' },
        departureTime: new Date().toISOString(),
    },
    booking: {
        id: 'booking-001',
        status: 'CONFIRMED',
        numberOfSeats: 1,
    },
    resolvedBy: null,
};

// ==================== TEST SUITES ====================

describe('Report Feature — Functional Tests (API)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. POST /api/reports — Positive Scenarios
    // --------------------------------------------------
    describe('POST /api/reports — Success Cases', () => {

        /**
         * TEST: Successfully create a report with valid data
         * Expected: 201 Created with { success: true, data: report }
         */
        test('should return 201 when creating a report with valid data', async () => {
            mockReportCreate.mockResolvedValue(mockReport);

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Driver was speeding and using phone');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(res.body.data.id).toBe('report-func-001');
            expect(res.body.data.type).toBe('DRIVER');
            expect(res.body.data.status).toBe('PENDING');
        });

        /**
         * TEST: Create a report with 2 evidence image uploads
         * Expected: 201 Created with images uploaded to Cloudinary
         */
        test('should return 201 when creating a report with 2 images', async () => {
            const reportWithImages = {
                ...mockReport,
                id: 'report-func-002',
                images: [
                    'https://res.cloudinary.com/demo/painamnae/reports/mock-evidence.jpg',
                    'https://res.cloudinary.com/demo/painamnae/reports/mock-evidence.jpg',
                ],
            };
            mockReportCreate.mockResolvedValue(reportWithImages);

            const fakeImageBuffer = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                'base64'
            );

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Driver was speeding, attaching evidence photos')
                .attach('images', fakeImageBuffer, 'evidence1.png')
                .attach('images', fakeImageBuffer, 'evidence2.png');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.images).toHaveLength(2);
        });

        /**
         * TEST: Create a report with optional fields
         */
        test('should return 201 when creating a report with all optional fields', async () => {
            mockReportCreate.mockResolvedValue(mockReport);

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Detailed report with all optional fields')
                .field('routeId', 'route-001')
                .field('bookingId', 'booking-001')
                .field('targetUserId', 'driver-001');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });

    // --------------------------------------------------
    // 2. POST /api/reports — Authentication Errors
    // --------------------------------------------------
    describe('POST /api/reports — Authentication', () => {

        /**
         * TEST: Reject request without auth token
         * Expected: 401 Unauthorized
         */
        test('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .post('/api/reports')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'No token provided for this report');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Reject request with invalid auth token
         * Expected: 401 Unauthorized
         */
        test('should return 401 when an invalid token is provided', async () => {
            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer invalid-token-xyz')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Invalid token report attempt');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 3. POST /api/reports — Validation Errors
    // --------------------------------------------------
    describe('POST /api/reports — Validation Errors', () => {

        /**
         * TEST: Reject invalid report type
         * Expected: 400 Bad Request
         */
        test('should return 400 when type is invalid', async () => {
            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('type', 'INVALID_TYPE')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Report with invalid type');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Reject invalid category
         * Expected: 400 Bad Request
         */
        test('should return 400 when category is invalid', async () => {
            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('type', 'DRIVER')
                .field('category', 'INVALID_CATEGORY')
                .field('description', 'Report with invalid category');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Reject description shorter than 5 characters
         * Expected: 400 Bad Request
         */
        test('should return 400 when description is too short', async () => {
            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Hi');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Reject missing required type field
         * Expected: 400 Bad Request
         */
        test('should return 400 when type is missing', async () => {
            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Report without type field');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Reject missing required description field
         * Expected: 400 Bad Request
         */
        test('should return 400 when description is missing', async () => {
            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 4. GET /api/reports/me — User's Own Reports
    // --------------------------------------------------
    describe('GET /api/reports/me — My Reports', () => {

        /**
         * TEST: Get passenger's own reports
         * Expected: 200 with array of reports
         */
        test('should return 200 with passenger own reports', async () => {
            mockReportFindMany.mockResolvedValue([
                { ...mockReport, id: 'report-1' },
                { ...mockReport, id: 'report-2', category: 'VEHICLE_ISSUE' },
            ]);

            const res = await request(app)
                .get('/api/reports/me')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });

        /**
         * TEST: Unauthenticated access to /me is rejected
         */
        test('should return 401 when accessing /me without auth', async () => {
            const res = await request(app)
                .get('/api/reports/me');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 5. GET /api/reports/:id — Single Report
    // --------------------------------------------------
    describe('GET /api/reports/:id — Single Report', () => {

        /**
         * TEST: Get report by ID
         * Expected: 200 with report data
         */
        test('should return 200 with report data', async () => {
            mockReportFindUnique.mockResolvedValue(mockReport);

            const res = await request(app)
                .get('/api/reports/report-func-001')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe('report-func-001');
        });

        /**
         * TEST: Get non-existent report
         * Expected: 404 Not Found
         */
        test('should return 404 when report does not exist', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/reports/nonexistent-report')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 6. GET /api/reports/booking/:bookingId — Report for Booking
    // --------------------------------------------------
    describe('GET /api/reports/booking/:bookingId — Report for Booking', () => {

        /**
         * TEST: Check if report exists for a booking (found)
         * Expected: 200 with hasReport: true
         */
        test('should return 200 with hasReport true when report exists', async () => {
            mockReportFindFirst.mockResolvedValue(mockReport);

            const res = await request(app)
                .get('/api/reports/booking/booking-001')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.hasReport).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        /**
         * TEST: Check if report exists for a booking (not found)
         * Expected: 200 with hasReport: false
         */
        test('should return 200 with hasReport false when no report exists', async () => {
            mockReportFindFirst.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/reports/booking/booking-new')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.hasReport).toBe(false);
        });
    });

    // --------------------------------------------------
    // 7. PATCH /api/reports/admin/:id — Admin Status Update
    // --------------------------------------------------
    describe('PATCH /api/reports/admin/:id — Admin Status Update', () => {

        /**
         * TEST: Admin can update report status
         * Expected: 200 with updated report
         */
        test('should return 200 when admin updates report status', async () => {
            const resolvedReport = {
                ...mockReport,
                status: 'RESOLVED',
                adminNotes: 'Reviewed and resolved',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
            };
            mockReportFindUnique.mockResolvedValue(mockReport);
            mockReportUpdate.mockResolvedValue(resolvedReport);

            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: 'RESOLVED', adminNotes: 'Reviewed and resolved' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('RESOLVED');
        });

        /**
         * TEST: Non-admin user cannot update report status
         * Expected: 403 Forbidden
         */
        test('should return 403 when non-admin tries to update report status', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-passenger-token')
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Invalid status value is rejected
         * Expected: 400 Bad Request
         */
        test('should return 400 when status value is invalid', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: 'INVALID_STATUS' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 8. POST /api/reports — Image Limit
    // --------------------------------------------------
    describe('POST /api/reports — Image Upload Limit', () => {

        /**
         * TEST: Reject upload with more than 2 images
         * Business Rule: Max 2 images allowed per report.
         * NOTE: Multer's maxCount: 2 handles this at middleware level.
         */
        test('should reject upload with more than 2 images', async () => {
            const fakeImageBuffer = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                'base64'
            );

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Report with too many images attached')
                .attach('images', fakeImageBuffer, 'evidence1.png')
                .attach('images', fakeImageBuffer, 'evidence2.png')
                .attach('images', fakeImageBuffer, 'evidence3.png');

            // Multer should reject with LIMIT_UNEXPECTED_FILE error
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body.success).toBe(false);
        });
    });
});
