/**
 * ============================================================
 * INTEGRATION TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStauts
 * Test Level  : Integration
 * User Story  : As an admin, I want to keep the users updated
 *               on their reported incidents.
 * File        : tests/backend/integrate/adminReportStauts.integration.test.js
 * ============================================================
 */

// --------------- Mock Prisma ---------------
const mockReportFindUnique = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportUpdate = jest.fn();

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    report: {
        findUnique: mockReportFindUnique,
        findMany: mockReportFindMany,
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

describe('Admin Report Status Update — Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. Service ↔ Database: Admin Updates Status (RESOLVED)
    // --------------------------------------------------
    describe('Admin Status Update — Service ↔ Database', () => {

        test('should persist PENDING → RESOLVED with admin resolution metadata', async () => {
            const pendingReport = createFullReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const resolvedReport = {
                ...pendingReport,
                status: 'RESOLVED',
                adminNotes: 'Driver warned and issue resolved',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
                resolvedBy: mockAdmin,
            };
            mockReportUpdate.mockResolvedValue(resolvedReport);

            const result = await reportService.updateReportStatus(
                'report-int-001', 'RESOLVED', 'Driver warned and issue resolved', mockAdmin.id
            );

            expect(result.status).toBe('RESOLVED');
            expect(result.resolvedBy).toBeDefined();
            expect(result.resolvedBy.id).toBe(mockAdmin.id);

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

    // --------------------------------------------------
    // 2. Service ↔ Database: Passenger Sees Updated Status
    // --------------------------------------------------
    describe('Passenger Retrieves Updated Status — Service ↔ Database', () => {

        test('should return updated status when passenger queries their reports', async () => {
            const resolvedReports = [
                createFullReport({
                    id: 'report-int-001',
                    status: 'RESOLVED',
                    adminNotes: 'Driver warned',
                    resolvedAt: new Date(),
                    resolvedById: mockAdmin.id,
                    resolvedBy: mockAdmin,
                }),
            ];
            mockReportFindMany.mockResolvedValue(resolvedReports);

            const result = await reportService.getReportsByUser(mockPassenger.id);

            expect(result).toHaveLength(1);
            expect(result[0].status).toBe('RESOLVED');
            expect(result[0].resolvedBy).toBeDefined();
            expect(result[0].resolvedBy.id).toBe(mockAdmin.id);

            expect(mockReportFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { reporterId: mockPassenger.id },
                    orderBy: { createdAt: 'desc' },
                })
            );
        });
    });

    // --------------------------------------------------
    // 3. Service ↔ Database: Error Handling
    // --------------------------------------------------
    describe('Error Handling — Service ↔ Database', () => {

        test('should throw 404 when report does not exist for status update', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            await expect(
                reportService.updateReportStatus('nonexistent-report', 'RESOLVED', null, mockAdmin.id)
            ).rejects.toThrow('Report not found');
        });
    });
});
