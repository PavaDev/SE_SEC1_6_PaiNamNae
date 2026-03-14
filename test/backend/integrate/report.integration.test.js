/**
 * ============================================================
 * INTEGRATION TESTS — Report Feature
 * ============================================================
 * Test Level  : Integration
 * User Story  : As a passenger, I want to report the driver's
 *               behavior to the administrator and receive
 *               updates about the reported case.
 * File        : tests/backend/integrate/report.integration.test.js
 * Business Rules:
 *   - Passenger can only report after the trip has ended
 *   - Report button disappears after being pressed (one per booking)
 * ============================================================
 */

// --------------- Mock Prisma ---------------
const mockReportCreate = jest.fn();
const mockReportFindUnique = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportUpdate = jest.fn();

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    report: {
        create: mockReportCreate,
        findUnique: mockReportFindUnique,
        findFirst: mockReportFindFirst,
        update: mockReportUpdate,
    },
}));

const reportService = require('../../../src/backend/src/services/report.service');

// --------------- Test Data ---------------

const mockPassenger = {
    id: 'passenger-001',
    firstName: 'Jane',
    lastName: 'Passenger',
    email: 'jane@example.com',
    profilePicture: null,
};

const mockDriver = {
    id: 'driver-001',
    firstName: 'John',
    lastName: 'Driver',
    email: 'john@example.com',
    profilePicture: null,
};

const mockAdmin = {
    id: 'admin-001',
    firstName: 'Admin',
    lastName: 'User',
};

const mockRoute = {
    id: 'route-001',
    startLocation: { name: 'CentralWorld', lat: 13.7466, lng: 100.5391 },
    endLocation: { name: 'Siam Paragon', lat: 13.7462, lng: 100.5349 },
    departureTime: new Date('2026-02-17T08:00:00Z'),
};

const mockBooking = {
    id: 'booking-001',
    status: 'CONFIRMED',
    numberOfSeats: 1,
};

/**
 * Creates a full mock report with populated relations
 */
const createFullReport = (overrides = {}) => ({
    id: 'report-int-001',
    reporterId: mockPassenger.id,
    type: 'DRIVER',
    category: 'SAFETY_ISSUE',
    description: 'Driver was on phone while driving on highway',
    images: null,
    status: 'PENDING',
    adminNotes: null,
    routeId: mockRoute.id,
    bookingId: mockBooking.id,
    targetUserId: mockDriver.id,
    resolvedAt: null,
    resolvedById: null,
    createdAt: new Date('2026-02-17T10:00:00Z'),
    reporter: mockPassenger,
    targetUser: mockDriver,
    route: mockRoute,
    booking: mockBooking,
    resolvedBy: null,
    ...overrides,
});

// ==================== TEST SUITES ====================

describe('Report Feature — Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. Service ↔ Database: Create Report
    //    (passenger reports after trip ended)
    // --------------------------------------------------
    describe('Create Report — Service ↔ Database', () => {

        test('should create report and store with correct relationships', async () => {
            const fullReport = createFullReport();
            mockReportCreate.mockResolvedValue(fullReport);

            const result = await reportService.createReport({
                reporterId: mockPassenger.id,
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
                description: 'Driver was on phone while driving on highway',
                images: null,
                routeId: mockRoute.id,
                bookingId: mockBooking.id,
                targetUserId: mockDriver.id,
            });

            // Verify report was created with correct data
            expect(result.id).toBe('report-int-001');
            expect(result.reporterId).toBe(mockPassenger.id);
            expect(result.targetUserId).toBe(mockDriver.id);
            expect(result.status).toBe('PENDING');

            // Verify correct Prisma create call
            expect(mockReportCreate).toHaveBeenCalledWith({
                data: {
                    reporterId: mockPassenger.id,
                    type: 'DRIVER',
                    category: 'SAFETY_ISSUE',
                    description: 'Driver was on phone while driving on highway',
                    images: null,
                    routeId: mockRoute.id,
                    bookingId: mockBooking.id,
                    targetUserId: mockDriver.id,
                },
                include: expect.objectContaining({
                    reporter: expect.any(Object),
                    targetUser: expect.any(Object),
                    route: expect.any(Object),
                    booking: expect.any(Object),
                    resolvedBy: expect.any(Object),
                }),
            });
        });
    });

    // --------------------------------------------------
    // 2. Service ↔ Database: Get Report (receive updates)
    //    + Duplicate Check (button disappears)
    // --------------------------------------------------
    describe('Get Report — Service ↔ Database', () => {

        test('should retrieve report by ID with all related data', async () => {
            const fullReport = createFullReport();
            mockReportFindUnique.mockResolvedValue(fullReport);

            const result = await reportService.getReportById('report-int-001');

            expect(result).toBeDefined();
            expect(result.reporter).toBeDefined();
            expect(result.targetUser).toBeDefined();
            expect(result.route).toBeDefined();
            expect(result.booking).toBeDefined();

            expect(mockReportFindUnique).toHaveBeenCalledWith({
                where: { id: 'report-int-001' },
                include: expect.objectContaining({
                    reporter: expect.any(Object),
                    targetUser: expect.any(Object),
                    route: expect.any(Object),
                    booking: expect.any(Object),
                    resolvedBy: expect.any(Object),
                }),
            });
        });

        test('should query report by bookingId and reporterId (duplicate check)', async () => {
            const fullReport = createFullReport();
            mockReportFindFirst.mockResolvedValue(fullReport);

            const result = await reportService.getReportByBookingId('booking-001', 'passenger-001');

            expect(result).toBeDefined();
            expect(mockReportFindFirst).toHaveBeenCalledWith({
                where: { bookingId: 'booking-001', reporterId: 'passenger-001' },
                include: expect.objectContaining({
                    reporter: expect.any(Object),
                }),
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    // --------------------------------------------------
    // 3. Service ↔ Database: Status Update Flow
    //    (passenger receives updates on reported case)
    // --------------------------------------------------
    describe('Status Update Flow — Service ↔ Database', () => {

        test('should update PENDING → RESOLVED with admin resolution metadata', async () => {
            const pendingReport = createFullReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const resolvedReport = {
                ...pendingReport,
                status: 'RESOLVED',
                adminNotes: 'Violation confirmed by admin',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
                resolvedBy: mockAdmin,
            };
            mockReportUpdate.mockResolvedValue(resolvedReport);

            const result = await reportService.updateReportStatus(
                'report-int-001',
                'RESOLVED',
                'Violation confirmed by admin',
                mockAdmin.id
            );

            expect(result.status).toBe('RESOLVED');
            expect(result.adminNotes).toBe('Violation confirmed by admin');
            expect(result.resolvedById).toBe(mockAdmin.id);

            expect(mockReportUpdate).toHaveBeenCalledWith({
                where: { id: 'report-int-001' },
                data: expect.objectContaining({
                    status: 'RESOLVED',
                    resolvedAt: expect.any(Date),
                    resolvedById: mockAdmin.id,
                }),
                include: expect.any(Object),
            });
        });
    });
});
