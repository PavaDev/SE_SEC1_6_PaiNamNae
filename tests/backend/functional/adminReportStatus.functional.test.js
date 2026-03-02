/**
 * ============================================================
 * FUNCTIONAL TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStauts
 * Test Level  : Functional
 * User Story  : As an admin, I want to keep the users updated
 *               on their reported incidents.
 * File        : tests/backend/functional/adminReportStauts.functional.test.js
 * ============================================================
 */

// --------------- Mock External Dependencies ---------------

const mockReportFindUnique = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportUpdate = jest.fn();
const mockReportCount = jest.fn();
const mockQueryRaw = jest.fn().mockResolvedValue([1]);

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $queryRaw: mockQueryRaw,
    report: {
        findUnique: mockReportFindUnique,
        findMany: mockReportFindMany,
        update: mockReportUpdate,
        count: mockReportCount,
    },
}));

jest.mock('../../../src/backend/src/utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/painamnae/reports/mock-evidence.jpg',
        public_id: 'painamnae/reports/mock-evidence',
    }),
    deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

jest.mock('../../../src/backend/src/utils/jwt', () => ({
    verifyToken: jest.fn((token) => {
        if (token === 'valid-passenger-token') {
            return { sub: 'passenger-001', role: 'PASSENGER' };
        }
        if (token === 'valid-admin-token') {
            return { sub: 'admin-001', role: 'ADMIN' };
        }
        throw new Error('Invalid token');
    }),
    generateToken: jest.fn(),
}));

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
    // 1. PATCH /api/reports/admin/:id — Admin Updates Status
    // --------------------------------------------------
    describe('PATCH /api/reports/admin/:id — Success', () => {

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
    });

    // --------------------------------------------------
    // 2. PATCH /api/reports/admin/:id — Only Admin Allowed
    // --------------------------------------------------
    describe('PATCH /api/reports/admin/:id — Authorization', () => {

        test('should return 403 when non-admin tries to update report status', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-func-001')
                .set('Authorization', 'Bearer valid-passenger-token')
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 3. PATCH /api/reports/admin/:id — Report Not Found
    // --------------------------------------------------
    describe('PATCH /api/reports/admin/:id — Not Found', () => {

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
});
