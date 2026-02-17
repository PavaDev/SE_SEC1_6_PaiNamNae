/**
 * ============================================================
 * FUNCTIONAL TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStauts
 * Test Level  : Functional
 * File        : tests/backend/functional/adminReportStauts.functional.test.js
 * Purpose     : Validate backend API endpoints related to admin
 *               report status update. Tests PATCH /api/reports/admin/:id
 *               covering positive and negative scenarios with
 *               correct HTTP status codes and response messages.
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

// --------------- Build Express App ---------------

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

describe('Admin Report Status Update — Functional Tests (API)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. PATCH /api/reports/admin/:id — Positive Scenarios
    // --------------------------------------------------
    describe('PATCH /api/reports/admin/:id — Success Cases', () => {

        /**
         * TEST: Admin can update report status to RESOLVED
         * Expected: 200 with updated report data
         */
        test('should return 200 when admin updates report status to RESOLVED', async () => {
            const resolvedReport = {
                ...mockReport,
                status: 'RESOLVED',
                adminNotes: 'Reviewed and resolved',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
                resolvedBy: { id: 'admin-001', firstName: 'Admin', lastName: 'User' },
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
            expect(res.body.data.adminNotes).toBe('Reviewed and resolved');
        });

        /**
         * TEST: Admin can update report status to APPROVED
         * Expected: 200 with updated report data
         */
        test('should return 200 when admin updates report status to APPROVED', async () => {
            const approvedReport = {
                ...mockReport,
                status: 'APPROVED',
                adminNotes: 'Violation confirmed',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
            };
            mockReportFindUnique.mockResolvedValue(mockReport);
            mockReportUpdate.mockResolvedValue(approvedReport);

            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: 'APPROVED', adminNotes: 'Violation confirmed' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('APPROVED');
        });

        /**
         * TEST: Admin can update report status to REJECTED
         * Expected: 200 with updated report data
         */
        test('should return 200 when admin updates report status to REJECTED', async () => {
            const rejectedReport = {
                ...mockReport,
                status: 'REJECTED',
                adminNotes: 'Insufficient evidence',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
            };
            mockReportFindUnique.mockResolvedValue(mockReport);
            mockReportUpdate.mockResolvedValue(rejectedReport);

            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: 'REJECTED', adminNotes: 'Insufficient evidence' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('REJECTED');
        });

        /**
         * TEST: Admin can update report status without adminNotes
         * Expected: 200 (adminNotes is optional)
         */
        test('should return 200 when admin updates status without adminNotes', async () => {
            const approvedReport = {
                ...mockReport,
                status: 'APPROVED',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
            };
            mockReportFindUnique.mockResolvedValue(mockReport);
            mockReportUpdate.mockResolvedValue(approvedReport);

            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: 'APPROVED' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('APPROVED');
        });
    });

    // --------------------------------------------------
    // 2. PATCH /api/reports/admin/:id — Authorization Errors
    // --------------------------------------------------
    describe('PATCH /api/reports/admin/:id — Authorization', () => {

        /**
         * TEST: Non-admin user (PASSENGER) cannot update report status
         * Expected: 403 Forbidden
         * Business Rule: Only admin users are allowed to update report status.
         */
        test('should return 403 when passenger tries to update report status', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-passenger-token')
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Non-admin user (DRIVER) cannot update report status
         * Expected: 403 Forbidden
         */
        test('should return 403 when driver tries to update report status', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-driver-token')
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Request without auth token is rejected
         * Expected: 401 Unauthorized
         */
        test('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Request with invalid auth token is rejected
         * Expected: 401 Unauthorized
         */
        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer invalid-token-xyz')
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 3. PATCH /api/reports/admin/:id — Validation Errors
    // --------------------------------------------------
    describe('PATCH /api/reports/admin/:id — Validation Errors', () => {

        /**
         * TEST: Invalid status value is rejected
         * Expected: 400 Bad Request
         * Business Rule: Status must be PENDING/APPROVED/REJECTED/RESOLVED.
         */
        test('should return 400 when status value is invalid', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: 'INVESTIGATING' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Missing status field is rejected
         * Expected: 400 Bad Request
         */
        test('should return 400 when status field is missing', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ adminNotes: 'Notes without status' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Empty string status is rejected
         * Expected: 400 Bad Request
         */
        test('should return 400 when status is empty string', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: '' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 4. PATCH /api/reports/admin/:id — Not Found
    // --------------------------------------------------
    describe('PATCH /api/reports/admin/:id — Not Found', () => {

        /**
         * TEST: Update on non-existing report is rejected
         * Expected: 404 Not Found
         * Business Rule: The system must reject updates on non-existing reports.
         */
        test('should return 404 when report does not exist', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            const res = await request(app)
                .patch('/api/reports/admin/nonexistent-report-id')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 5. GET /api/reports/admin — Admin List Reports
    // --------------------------------------------------
    describe('GET /api/reports/admin — Admin List Reports', () => {

        /**
         * TEST: Admin can view all submitted passenger reports
         * Expected: 200 with array of reports
         * Business Rule: Admin can view all submitted passenger reports.
         */
        test('should return 200 with all reports for admin', async () => {
            mockReportFindMany.mockResolvedValue([
                { ...mockReport, id: 'report-1' },
                { ...mockReport, id: 'report-2', status: 'RESOLVED' },
            ]);
            mockReportCount.mockResolvedValue(2);

            const res = await request(app)
                .get('/api/reports/admin')
                .set('Authorization', 'Bearer valid-admin-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        /**
         * TEST: Non-admin cannot access admin report list
         * Expected: 403 Forbidden
         */
        test('should return 403 when non-admin tries to list all reports', async () => {
            const res = await request(app)
                .get('/api/reports/admin')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 6. GET /api/reports/admin/:id — Admin View Single Report
    // --------------------------------------------------
    describe('GET /api/reports/admin/:id — Admin View Single Report', () => {

        /**
         * TEST: Admin can view a specific report by ID
         * Expected: 200 with report data
         */
        test('should return 200 with report details for admin', async () => {
            mockReportFindUnique.mockResolvedValue(mockReport);

            const res = await request(app)
                .get('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-admin-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe('report-func-001');
        });

        /**
         * TEST: Admin gets 404 for non-existent report
         * Expected: 404 Not Found
         */
        test('should return 404 when admin views non-existent report', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/reports/admin/nonexistent-report')
                .set('Authorization', 'Bearer valid-admin-token');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });
});
