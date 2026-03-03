/**
 * ============================================================
 * UAT TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStauts
 * Test Level  : UAT (User Acceptance Testing)
 * User Story  : As an admin, I want to keep the users updated
 *               on their reported incidents.
 * File        : tests/backend/uat/adminReportStauts.uat.test.js
 * ============================================================
 */

// --------------- Mock External Dependencies ---------------

const mockReportFindUnique = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportUpdate = jest.fn();
const mockReportCount = jest.fn();
const mockQueryRaw = jest.fn().mockResolvedValue([1]);

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $queryRaw: mockQueryRaw,
    report: {
        findUnique: mockReportFindUnique,
        findFirst: mockReportFindFirst,
        findMany: mockReportFindMany,
        update: mockReportUpdate,
        count: mockReportCount,
    },
}));

jest.mock('../../../src/backend/src/utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/painamnae/reports/uploaded-evidence.jpg',
        public_id: 'painamnae/reports/uploaded-evidence',
    }),
    deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

jest.mock('../../../src/backend/src/utils/jwt', () => ({
    verifyToken: jest.fn((token) => {
        if (token === 'passenger-token') {
            return { sub: 'passenger-001', role: 'PASSENGER' };
        }
        if (token === 'admin-token') {
            return { sub: 'admin-001', role: 'ADMIN' };
        }
        throw new Error('Invalid token');
    }),
    generateToken: jest.fn(),
}));

jest.mock('../../../src/backend/src/bootstrap/ensureAdmin', () => jest.fn().mockResolvedValue());

const request = require('supertest');

// --------------- Build Test App ---------------

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

// --------------- Shared Test Data ---------------

const PASSENGER_AUTH = 'Bearer passenger-token';
const ADMIN_AUTH = 'Bearer admin-token';

const createMockApiReport = (overrides = {}) => ({
    id: 'report-uat-001',
    reporterId: 'passenger-001',
    type: 'DRIVER',
    category: 'SAFETY_ISSUE',
    description: 'The driver was using phone while driving on the expressway',
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
        startLocation: { name: 'CentralWorld', lat: 13.7466, lng: 100.5391 },
        endLocation: { name: 'Siam Paragon', lat: 13.7462, lng: 100.5349 },
        departureTime: new Date().toISOString(),
    },
    booking: {
        id: 'booking-001',
        status: 'CONFIRMED',
        numberOfSeats: 1,
    },
    resolvedBy: null,
    ...overrides,
});

// ==================== UAT SCENARIOS ====================

describe('Admin Report Status Update — UAT (Acceptance Tests)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // Scenario 1: Admin views all submitted reports
    // --------------------------------------------------
    describe('Scenario 1: Admin views all submitted passenger reports', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin user who is logged in
         * - When they access the admin reports dashboard
         * - Then the system shows all submitted passenger reports
         */
        test('AC: Admin can view all submitted reports with current statuses', async () => {
            const reports = [
                createMockApiReport({ id: 'r-001', status: 'PENDING' }),
                createMockApiReport({ id: 'r-002', status: 'RESOLVED' }),
            ];
            mockReportFindMany.mockResolvedValue(reports);
            mockReportCount.mockResolvedValue(2);

            const res = await request(app)
                .get('/api/reports/admin')
                .set('Authorization', ADMIN_AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });
    });

    // --------------------------------------------------
    // Scenario 2: Admin updates report status and
    //             passenger sees the change
    // --------------------------------------------------
    describe('Scenario 2: Admin updates report status → passenger sees update', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin reviewing a submitted report
         * - When the admin updates the status to RESOLVED
         * - Then the report status is updated in the system
         * - And the passenger can see the updated status
         */
        test('AC: Admin resolves a report and passenger sees the resolution', async () => {
            // Step 1: Admin updates report status to RESOLVED
            const pendingReport = createMockApiReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const resolvedReport = createMockApiReport({
                status: 'RESOLVED',
                adminNotes: 'Investigated the complaint. Driver has been warned.',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
                resolvedBy: { id: 'admin-001', firstName: 'Admin', lastName: 'User' },
            });
            mockReportUpdate.mockResolvedValue(resolvedReport);

            const updateRes = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', ADMIN_AUTH)
                .send({
                    status: 'RESOLVED',
                    adminNotes: 'Investigated the complaint. Driver has been warned.',
                });

            expect(updateRes.status).toBe(200);
            expect(updateRes.body.success).toBe(true);
            expect(updateRes.body.data.status).toBe('RESOLVED');
            expect(updateRes.body.data.adminNotes).toContain('Driver has been warned');

            // Step 2: Passenger checks their report and sees the updated status
            mockReportFindFirst.mockResolvedValue(resolvedReport);

            const passengerRes = await request(app)
                .get('/api/reports/booking/booking-001')
                .set('Authorization', PASSENGER_AUTH);

            expect(passengerRes.status).toBe(200);
            expect(passengerRes.body.hasReport).toBe(true);
            expect(passengerRes.body.data.status).toBe('RESOLVED');
        });
    });

    // --------------------------------------------------
    // Scenario 3: Non-admin blocked from updating status
    // --------------------------------------------------
    describe('Scenario 3: Non-admin blocked from updating report status', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger user who is logged in
         * - When they try to update a report status
         * - Then the system rejects with 403 Forbidden
         */
        test('AC: Passenger is blocked from updating report status', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', PASSENGER_AUTH)
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });
});
