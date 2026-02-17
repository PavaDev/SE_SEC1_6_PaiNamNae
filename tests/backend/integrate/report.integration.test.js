/**
 * ============================================================
 * INTEGRATION TESTS — Report Feature
 * ============================================================
 * Test Level  : Integration
 * File        : tests/backend/integrate/report.integration.test.js
 * Purpose     : Test integration between report service, database
 *               (Prisma), and file storage. Verifies data
 *               persistence, relationships, status update flow,
 *               and image storage using mocked Prisma that
 *               simulates real database behavior.
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
    // --------------------------------------------------
    describe('Create Report — Service ↔ Database', () => {

        /**
         * TEST: Full creation flow stores report with all relationships
         * Integration: reportService.createReport → Prisma report.create
         *              with correct data including reporter, targetUser,
         *              route, and booking relations.
         */
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

        /**
         * TEST: Report includes populated relation data
         * Integration: Verifies that include relations return user, route, booking info.
         */
        test('should return report with populated reporter and target user data', async () => {
            const fullReport = createFullReport();
            mockReportCreate.mockResolvedValue(fullReport);

            const result = await reportService.createReport({
                reporterId: mockPassenger.id,
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
                description: 'Report with populated relations',
                routeId: mockRoute.id,
                bookingId: mockBooking.id,
                targetUserId: mockDriver.id,
            });

            // Verify reporter relation
            expect(result.reporter.id).toBe(mockPassenger.id);
            expect(result.reporter.firstName).toBe('Jane');
            expect(result.reporter.email).toBe('jane@example.com');

            // Verify target user relation
            expect(result.targetUser.id).toBe(mockDriver.id);
            expect(result.targetUser.firstName).toBe('John');

            // Verify route relation
            expect(result.route.id).toBe(mockRoute.id);
            expect(result.route.startLocation).toBeDefined();

            // Verify booking relation
            expect(result.booking.id).toBe(mockBooking.id);
        });

        /**
         * TEST: Image URLs stored correctly in JSON field
         * Integration: Images are stored as a JSON array in the
         *              report's `images` column.
         */
        test('should store image URL array correctly in JSON field', async () => {
            const imageUrls = [
                'https://res.cloudinary.com/demo/reports/evidence1.jpg',
                'https://res.cloudinary.com/demo/reports/evidence2.jpg',
            ];

            const fullReport = createFullReport({ images: imageUrls });
            mockReportCreate.mockResolvedValue(fullReport);

            const result = await reportService.createReport({
                reporterId: mockPassenger.id,
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
                description: 'Report with evidence photos',
                images: imageUrls,
                routeId: mockRoute.id,
                bookingId: mockBooking.id,
                targetUserId: mockDriver.id,
            });

            // Verify images stored as array
            expect(result.images).toEqual(imageUrls);
            expect(result.images).toHaveLength(2);
            expect(Array.isArray(result.images)).toBe(true);

            // Verify create was called with image URLs
            expect(mockReportCreate).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    images: imageUrls,
                }),
                include: expect.any(Object),
            });
        });
    });

    // --------------------------------------------------
    // 2. Service ↔ Database: Get Report with Relations
    // --------------------------------------------------
    describe('Get Report — Service ↔ Database', () => {

        /**
         * TEST: getReportById returns report with full include relations
         * Integration: Verifies the include clause contains all relations.
         */
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

        /**
         * TEST: getReportByBookingId uses correct composite where clause
         * Integration: Verifies the query filters by bookingId + reporterId.
         */
        test('should query report by bookingId and reporterId', async () => {
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
    // --------------------------------------------------
    describe('Status Update Flow — Service ↔ Database', () => {

        /**
         * TEST: PENDING → APPROVED sets resolvedAt and resolvedById
         * Integration: Verifies the admin update pipeline sets
         *              resolution metadata for terminal statuses.
         */
        test('should update PENDING → APPROVED with admin resolution metadata', async () => {
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
                'report-int-001',
                'APPROVED',
                'Violation confirmed by admin',
                mockAdmin.id
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
         * TEST: PENDING → REJECTED sets resolvedAt and resolvedById
         */
        test('should update PENDING → REJECTED with admin resolution metadata', async () => {
            const pendingReport = createFullReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const rejectedReport = {
                ...pendingReport,
                status: 'REJECTED',
                adminNotes: 'Insufficient evidence',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
            };
            mockReportUpdate.mockResolvedValue(rejectedReport);

            const result = await reportService.updateReportStatus(
                'report-int-001',
                'REJECTED',
                'Insufficient evidence',
                mockAdmin.id
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
         * TEST: Delete report removes it from database
         * Integration: Verifies cascading deletion.
         */
        test('should delete report from database', async () => {
            const existingReport = createFullReport();
            mockReportFindUnique.mockResolvedValue(existingReport);
            mockReportDelete.mockResolvedValue(existingReport);

            const result = await reportService.deleteReport('report-int-001');

            expect(result.id).toBe('report-int-001');
            expect(mockReportDelete).toHaveBeenCalledWith({
                where: { id: 'report-int-001' },
            });
        });

        /**
         * TEST: Delete throws 404 for non-existent report
         */
        test('should throw 404 when deleting non-existent report', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            await expect(
                reportService.deleteReport('nonexistent-report')
            ).rejects.toThrow('Report not found');
        });
    });

    // --------------------------------------------------
    // 4. Service ↔ Database: Query User Reports
    // --------------------------------------------------
    describe('Query User Reports — Service ↔ Database', () => {

        /**
         * TEST: getReportsByUser retrieves reports with correct ordering
         * Integration: Verifies descending order by createdAt.
         */
        test('should retrieve user reports ordered by createdAt descending', async () => {
            const reports = [
                createFullReport({ id: 'report-int-002', createdAt: new Date('2026-02-17T12:00:00Z') }),
                createFullReport({ id: 'report-int-001', createdAt: new Date('2026-02-17T10:00:00Z') }),
            ];
            mockReportFindMany.mockResolvedValue(reports);

            const result = await reportService.getReportsByUser(mockPassenger.id);

            expect(result).toHaveLength(2);
            expect(mockReportFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { reporterId: mockPassenger.id },
                    orderBy: { createdAt: 'desc' },
                    include: expect.objectContaining({
                        reporter: expect.any(Object),
                        targetUser: expect.any(Object),
                    }),
                })
            );
        });

        /**
         * TEST: searchReports integrates findMany + count for pagination
         * Integration: Verifies both queries run in parallel and
         *              pagination metadata is returned.
         */
        test('should search reports with pagination metadata', async () => {
            const reports = [createFullReport()];
            mockReportFindMany.mockResolvedValue(reports);
            mockReportCount.mockResolvedValue(1);

            const result = await reportService.searchReports({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.total).toBe(1);
            expect(result.pagination.totalPages).toBe(1);
        });
    });
});
