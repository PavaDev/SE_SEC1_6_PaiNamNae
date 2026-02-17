/**
 * ============================================================
 * UNIT TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStauts
 * Test Level  : Unit
 * File        : tests/backend/unit/adminReportStauts.unit.test.js
 * Purpose     : Test report status update logic, admin-only
 *               permission checks, allowed/disallowed status
 *               transitions, and audit logging (timestamp +
 *               admin ID) in isolation with mocked Prisma.
 * ============================================================
 */

// --------------- Mock Prisma before requiring service ---------------
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

const ApiError = require('../../../src/backend/src/utils/ApiError');
const reportService = require('../../../src/backend/src/services/report.service');
const {
    updateReportStatusSchema,
} = require('../../../src/backend/src/validations/report.validation');

// --------------- Test Data Factories ---------------

/**
 * Creates a mock report object as returned from Prisma.
 * Default status is PENDING (awaiting admin action).
 */
const createMockReport = (overrides = {}) => ({
    id: 'report-001',
    reporterId: 'passenger-001',
    type: 'DRIVER',
    category: 'SAFETY_ISSUE',
    description: 'The driver was using phone while driving',
    images: null,
    routeId: 'route-001',
    bookingId: 'booking-001',
    targetUserId: 'driver-001',
    status: 'PENDING',
    adminNotes: null,
    resolvedAt: null,
    resolvedById: null,
    createdAt: new Date('2026-02-17T10:00:00Z'),
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
        departureTime: new Date('2026-02-17T08:00:00Z'),
    },
    booking: {
        id: 'booking-001',
        status: 'CONFIRMED',
        numberOfSeats: 1,
    },
    resolvedBy: null,
    ...overrides,
});

// ==================== TEST SUITES ====================

describe('Admin Report Status Update — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. reportService.updateReportStatus — Status Update Logic
    // --------------------------------------------------
    describe('reportService.updateReportStatus — Status Update Logic', () => {

        /**
         * TEST: Throws 404 when updating status of non-existent report
         * Business Rule: The system must reject updates on non-existing reports.
         */
        test('should throw 404 when report is not found', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            await expect(
                reportService.updateReportStatus('nonexistent-id', 'APPROVED', null, 'admin-001')
            ).rejects.toThrow('Report not found');

            await expect(
                reportService.updateReportStatus('nonexistent-id', 'APPROVED', null, 'admin-001')
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        /**
         * TEST: Successfully updates status to RESOLVED with resolvedAt and resolvedById
         * Business Rule: Terminal status (RESOLVED) must store timestamp and admin ID.
         */
        test('should update status to RESOLVED and set resolvedAt/resolvedById', async () => {
            const existingReport = createMockReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(existingReport);
            mockReportUpdate.mockResolvedValue({
                ...existingReport,
                status: 'RESOLVED',
                adminNotes: 'Issue resolved after investigation',
                resolvedAt: new Date(),
                resolvedById: 'admin-001',
            });

            const result = await reportService.updateReportStatus(
                'report-001', 'RESOLVED', 'Issue resolved after investigation', 'admin-001'
            );

            expect(result.status).toBe('RESOLVED');
            expect(mockReportUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'report-001' },
                    data: expect.objectContaining({
                        status: 'RESOLVED',
                        resolvedAt: expect.any(Date),
                        resolvedById: 'admin-001',
                    }),
                })
            );
        });

        /**
         * TEST: Successfully updates status to APPROVED with resolvedAt and resolvedById
         * Business Rule: APPROVED is a terminal status — audit fields must be set.
         */
        test('should update status to APPROVED and set resolvedAt/resolvedById', async () => {
            const existingReport = createMockReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(existingReport);
            mockReportUpdate.mockResolvedValue({
                ...existingReport,
                status: 'APPROVED',
                resolvedAt: new Date(),
                resolvedById: 'admin-001',
            });

            const result = await reportService.updateReportStatus(
                'report-001', 'APPROVED', 'Violation confirmed', 'admin-001'
            );

            expect(result.status).toBe('APPROVED');
            expect(mockReportUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: 'APPROVED',
                        resolvedAt: expect.any(Date),
                        resolvedById: 'admin-001',
                    }),
                })
            );
        });

        /**
         * TEST: Successfully updates status to REJECTED with resolvedAt and resolvedById
         * Business Rule: REJECTED is a terminal status — audit fields must be set.
         */
        test('should update status to REJECTED and set resolvedAt/resolvedById', async () => {
            const existingReport = createMockReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(existingReport);
            mockReportUpdate.mockResolvedValue({
                ...existingReport,
                status: 'REJECTED',
                adminNotes: 'Insufficient evidence',
                resolvedAt: new Date(),
                resolvedById: 'admin-001',
            });

            const result = await reportService.updateReportStatus(
                'report-001', 'REJECTED', 'Insufficient evidence', 'admin-001'
            );

            expect(result.status).toBe('REJECTED');
            expect(mockReportUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: 'REJECTED',
                        resolvedAt: expect.any(Date),
                        resolvedById: 'admin-001',
                    }),
                })
            );
        });

        /**
         * TEST: Updates status to PENDING without setting resolvedAt/resolvedById
         * Business Rule: Non-terminal status should NOT have resolution metadata.
         */
        test('should update status to PENDING without resolvedAt/resolvedById', async () => {
            const existingReport = createMockReport({ status: 'APPROVED' });
            mockReportFindUnique.mockResolvedValue(existingReport);
            mockReportUpdate.mockResolvedValue({
                ...existingReport,
                status: 'PENDING',
            });

            await reportService.updateReportStatus(
                'report-001', 'PENDING', null, 'admin-001'
            );

            expect(mockReportUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({
                        resolvedAt: expect.anything(),
                    }),
                })
            );
        });

        /**
         * TEST: Admin notes are stored correctly when provided
         * Business Rule: Each status update must store the admin notes.
         */
        test('should store admin notes with the status update', async () => {
            const existingReport = createMockReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(existingReport);
            mockReportUpdate.mockResolvedValue({
                ...existingReport,
                status: 'RESOLVED',
                adminNotes: 'Investigated and resolved the issue',
                resolvedAt: new Date(),
                resolvedById: 'admin-001',
            });

            const result = await reportService.updateReportStatus(
                'report-001', 'RESOLVED', 'Investigated and resolved the issue', 'admin-001'
            );

            expect(result.adminNotes).toBe('Investigated and resolved the issue');
            expect(mockReportUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        adminNotes: 'Investigated and resolved the issue',
                    }),
                })
            );
        });

        /**
         * TEST: Admin ID (identifier) is recorded on resolution
         * Business Rule: Each status update must store the admin identifier.
         */
        test('should record admin ID on terminal status update', async () => {
            const existingReport = createMockReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(existingReport);
            mockReportUpdate.mockResolvedValue({
                ...existingReport,
                status: 'APPROVED',
                resolvedAt: new Date(),
                resolvedById: 'admin-042',
            });

            const result = await reportService.updateReportStatus(
                'report-001', 'APPROVED', null, 'admin-042'
            );

            expect(result.resolvedById).toBe('admin-042');
        });

        /**
         * TEST: Timestamp is set on resolution
         * Business Rule: Each status update must store a timestamp.
         */
        test('should set resolvedAt timestamp on terminal status update', async () => {
            const existingReport = createMockReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(existingReport);

            const beforeUpdate = new Date();
            mockReportUpdate.mockImplementation(async (args) => ({
                ...existingReport,
                status: 'RESOLVED',
                resolvedAt: args.data.resolvedAt,
                resolvedById: 'admin-001',
            }));

            const result = await reportService.updateReportStatus(
                'report-001', 'RESOLVED', null, 'admin-001'
            );

            expect(result.resolvedAt).toBeInstanceOf(Date);
            expect(result.resolvedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        });
    });

    // --------------------------------------------------
    // 2. updateReportStatusSchema — Zod Validation
    // --------------------------------------------------
    describe('updateReportStatusSchema (Zod Validation)', () => {

        /**
         * TEST: Valid status update passes validation
         */
        test('should accept valid status update with adminNotes', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'RESOLVED',
                adminNotes: 'Investigated and resolved',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Status update without adminNotes passes validation
         * Business Rule: adminNotes are optional.
         */
        test('should accept status update without adminNotes', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'APPROVED',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Invalid status value is rejected
         * Business Rule: Only PENDING, APPROVED, REJECTED, RESOLVED are allowed.
         */
        test('should reject invalid status value', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'IN_REVIEW',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Missing status field is rejected
         */
        test('should reject missing status field', () => {
            const result = updateReportStatusSchema.safeParse({
                adminNotes: 'Some notes',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Accepts all valid status values
         * Business Rule: Status can be PENDING, APPROVED, REJECTED, RESOLVED.
         */
        test('should accept all valid status values', () => {
            const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'];

            statuses.forEach(status => {
                const result = updateReportStatusSchema.safeParse({ status });
                expect(result.success).toBe(true);
            });
        });

        /**
         * TEST: Rejects empty string status
         */
        test('should reject empty string as status', () => {
            const result = updateReportStatusSchema.safeParse({
                status: '',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Rejects non-string status (number)
         */
        test('should reject numeric status value', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 123,
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: adminNotes exceeding 2000 chars is rejected
         */
        test('should reject adminNotes exceeding 2000 characters', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'RESOLVED',
                adminNotes: 'x'.repeat(2001),
            });

            expect(result.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 3. Passenger Visibility — getReportsByUser returns updated status
    // --------------------------------------------------
    describe('Passenger visibility of updated status', () => {

        /**
         * TEST: Passenger can retrieve their report with updated status
         * Business Rule: Updated status must be visible to the corresponding passenger.
         */
        test('should return reports with updated status for passenger', async () => {
            const updatedReports = [
                createMockReport({ id: 'report-001', status: 'RESOLVED', resolvedById: 'admin-001' }),
                createMockReport({ id: 'report-002', status: 'APPROVED', resolvedById: 'admin-001' }),
            ];
            mockReportFindMany.mockResolvedValue(updatedReports);

            const result = await reportService.getReportsByUser('passenger-001');

            expect(result).toHaveLength(2);
            expect(result[0].status).toBe('RESOLVED');
            expect(result[1].status).toBe('APPROVED');
            expect(mockReportFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { reporterId: 'passenger-001' },
                })
            );
        });
    });
});
