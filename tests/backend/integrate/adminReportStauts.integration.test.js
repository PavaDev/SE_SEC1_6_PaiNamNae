/**
 * ============================================================
 * INTEGRATION TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStauts
 * Test Level  : Integration
 * File        : tests/backend/integrate/adminReportStauts.integration.test.js
 * Purpose     : Test integration between admin API, database
 *               (Prisma), and report entities. Ensures updated
 *               status is persisted correctly and passenger
 *               can retrieve updated status.
 * ============================================================
 */

// --------------- Mock Prisma ---------------
const mockReportCreate = jest.fn();
const mockReportFindUnique = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportUpdate = jest.fn();
const mockReportDelete = jest.fn();
const mockReportCount = jest.fn();

jest.mock('../../../src/backend/src/utils/prisma', () => ({
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
 * Creates a full mock report with populated relations.
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

describe('Admin Report Status Update — Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. Service ↔ Database: Admin Status Update — Terminal Statuses
    // --------------------------------------------------
    describe('Admin Status Update — Service ↔ Database (Terminal Statuses)', () => {

        /**
         * TEST: PENDING → APPROVED persists with admin resolution metadata
         * Integration: Verifies Prisma update is called with resolvedAt,
         *              resolvedById, and adminNotes for APPROVED status.
         */
        test('should persist PENDING → APPROVED with admin resolution metadata', async () => {
            const pendingReport = createFullReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const approvedReport = {
                ...pendingReport,
                status: 'APPROVED',
                adminNotes: 'Violation confirmed by admin',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
                resolvedBy: mockAdmin,
            };
            mockReportUpdate.mockResolvedValue(approvedReport);

            const result = await reportService.updateReportStatus(
                'report-int-001', 'APPROVED', 'Violation confirmed by admin', mockAdmin.id
            );

            expect(result.status).toBe('APPROVED');
            expect(result.adminNotes).toBe('Violation confirmed by admin');
            expect(result.resolvedById).toBe(mockAdmin.id);

            expect(mockReportUpdate).toHaveBeenCalledWith({
                where: { id: 'report-int-001' },
                data: expect.objectContaining({
                    status: 'APPROVED',
                    resolvedAt: expect.any(Date),
                    resolvedById: mockAdmin.id,
                }),
                include: expect.any(Object),
            });
        });

        /**
         * TEST: PENDING → REJECTED persists with admin resolution metadata
         */
        test('should persist PENDING → REJECTED with admin resolution metadata', async () => {
            const pendingReport = createFullReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const rejectedReport = {
                ...pendingReport,
                status: 'REJECTED',
                adminNotes: 'Insufficient evidence provided',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
            };
            mockReportUpdate.mockResolvedValue(rejectedReport);

            const result = await reportService.updateReportStatus(
                'report-int-001', 'REJECTED', 'Insufficient evidence provided', mockAdmin.id
            );

            expect(result.status).toBe('REJECTED');
            expect(mockReportUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: 'REJECTED',
                        resolvedAt: expect.any(Date),
                        resolvedById: mockAdmin.id,
                    }),
                })
            );
        });

        /**
         * TEST: PENDING → RESOLVED persists with admin resolution metadata
         */
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
        });
    });

    // --------------------------------------------------
    // 2. Service ↔ Database: Non-Terminal Status Update
    // --------------------------------------------------
    describe('Admin Status Update — Service ↔ Database (Non-Terminal)', () => {

        /**
         * TEST: Update to PENDING does NOT set resolvedAt/resolvedById
         * Integration: Verifies that rolling back status to PENDING
         *              does not persist resolution metadata.
         */
        test('should persist status update to PENDING without resolution metadata', async () => {
            const approvedReport = createFullReport({ status: 'APPROVED' });
            mockReportFindUnique.mockResolvedValue(approvedReport);
            mockReportUpdate.mockResolvedValue({
                ...approvedReport,
                status: 'PENDING',
            });

            const result = await reportService.updateReportStatus(
                'report-int-001', 'PENDING', null, mockAdmin.id
            );

            expect(result.status).toBe('PENDING');
            expect(mockReportUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({
                        resolvedAt: expect.anything(),
                    }),
                })
            );
        });
    });

    // --------------------------------------------------
    // 3. Service ↔ Database: Passenger Retrieves Updated Status
    // --------------------------------------------------
    describe('Passenger Retrieves Updated Status — Service ↔ Database', () => {

        /**
         * TEST: Passenger can retrieve their reports with updated status
         * Integration: After admin updates status, passenger queries
         *              their reports and sees the new status.
         */
        test('should return updated status when passenger queries their reports', async () => {
            // Simulate: admin already updated report to RESOLVED
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
                    include: expect.objectContaining({
                        reporter: expect.any(Object),
                        targetUser: expect.any(Object),
                        resolvedBy: expect.any(Object),
                    }),
                })
            );
        });

        /**
         * TEST: getReportById includes resolvedBy relation after status update
         * Integration: Report detail includes the admin who resolved it.
         */
        test('should include resolvedBy relation in report detail', async () => {
            const resolvedReport = createFullReport({
                status: 'APPROVED',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
                resolvedBy: mockAdmin,
            });
            mockReportFindUnique.mockResolvedValue(resolvedReport);

            const result = await reportService.getReportById('report-int-001');

            expect(result).toBeDefined();
            expect(result.resolvedBy).toBeDefined();
            expect(result.resolvedBy.firstName).toBe('Admin');

            expect(mockReportFindUnique).toHaveBeenCalledWith({
                where: { id: 'report-int-001' },
                include: expect.objectContaining({
                    resolvedBy: expect.any(Object),
                }),
            });
        });
    });

    // --------------------------------------------------
    // 4. Service ↔ Database: Admin List Reports (searchReports)
    // --------------------------------------------------
    describe('Admin List Reports — Service ↔ Database', () => {

        /**
         * TEST: searchReports returns reports with pagination
         * Integration: Admin can list all submitted reports with pagination.
         */
        test('should return all submitted reports with pagination for admin', async () => {
            const reports = [
                createFullReport({ id: 'report-001', status: 'PENDING' }),
                createFullReport({ id: 'report-002', status: 'RESOLVED' }),
            ];
            mockReportFindMany.mockResolvedValue(reports);
            mockReportCount.mockResolvedValue(2);

            const result = await reportService.searchReports({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(2);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.total).toBe(2);
            expect(result.pagination.totalPages).toBe(1);
        });

        /**
         * TEST: searchReports filters by status
         * Integration: Admin can filter reports by specific status.
         */
        test('should filter reports by status when filtering is applied', async () => {
            const pendingReports = [
                createFullReport({ id: 'report-001', status: 'PENDING' }),
            ];
            mockReportFindMany.mockResolvedValue(pendingReports);
            mockReportCount.mockResolvedValue(1);

            const result = await reportService.searchReports({ page: 1, limit: 20, status: 'PENDING' });

            expect(result.data).toHaveLength(1);
            expect(mockReportFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'PENDING',
                    }),
                })
            );
        });
    });

    // --------------------------------------------------
    // 5. Service ↔ Database: Error Handling
    // --------------------------------------------------
    describe('Error Handling — Service ↔ Database', () => {

        /**
         * TEST: Throws 404 when updating non-existent report
         * Integration: Verifies error propagation from service layer.
         */
        test('should throw 404 when report does not exist for status update', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            await expect(
                reportService.updateReportStatus('nonexistent-report', 'APPROVED', null, mockAdmin.id)
            ).rejects.toThrow('Report not found');

            await expect(
                reportService.updateReportStatus('nonexistent-report', 'APPROVED', null, mockAdmin.id)
            ).rejects.toMatchObject({ statusCode: 404 });
        });
    });
});
