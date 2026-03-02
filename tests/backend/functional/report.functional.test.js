/**
 * ============================================================
 * FUNCTIONAL TESTS — Report Feature
 * ============================================================
 * Test Level  : Functional
 * User Story  : As a passenger, I want to report the driver's
 *               behavior to the administrator and receive
 *               updates about the reported case.
 * File        : tests/backend/functional/report.functional.test.js
 * Business Rules:
 *   - Passenger can only report after the trip has ended
 *   - Report button disappears after being pressed (one per booking)
 * ============================================================
 */

// --------------- Mock External Dependencies ---------------

// Mock Prisma
const mockReportCreate = jest.fn();
const mockReportFindUnique = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportFindMany = jest.fn();
const mockQueryRaw = jest.fn().mockResolvedValue([1]);

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $queryRaw: mockQueryRaw,
    report: {
        create: mockReportCreate,
        findUnique: mockReportFindUnique,
        findFirst: mockReportFindFirst,
        findMany: mockReportFindMany,
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
    // 1. POST /api/reports — Submit report after trip ended
    // --------------------------------------------------
    describe('POST /api/reports — Submit Report', () => {

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
    });

    // --------------------------------------------------
    // 2. POST /api/reports — Must be authenticated
    // --------------------------------------------------
    describe('POST /api/reports — Authentication', () => {

        test('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .post('/api/reports')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'No token provided for this report');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 3. GET /api/reports/booking/:bookingId — Duplicate
    //    check (report button visibility)
    // --------------------------------------------------
    describe('GET /api/reports/booking/:bookingId — Button Visibility', () => {

        test('should return hasReport true when report exists (button disappears)', async () => {
            mockReportFindFirst.mockResolvedValue(mockReport);

            const res = await request(app)
                .get('/api/reports/booking/booking-001')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.hasReport).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        test('should return hasReport false when no report exists (button visible)', async () => {
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
    // 4. GET /api/reports/me — Receive updates on cases
    // --------------------------------------------------
    describe('GET /api/reports/me — Receive Updates', () => {

        test('should return 200 with passenger own reports and statuses', async () => {
            mockReportFindMany.mockResolvedValue([
                { ...mockReport, id: 'report-1', status: 'PENDING' },
                { ...mockReport, id: 'report-2', status: 'RESOLVED' },
            ]);

            const res = await request(app)
                .get('/api/reports/me')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });
    });
});
