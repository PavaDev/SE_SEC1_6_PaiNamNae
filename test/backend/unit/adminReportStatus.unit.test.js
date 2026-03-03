/**
 * ============================================================
 * UNIT TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStauts
 * Test Level  : Unit
 * User Story  : As an admin, I want to keep the users updated
 *               on their reported incidents.
 * File        : tests/backend/unit/adminReportStauts.unit.test.js
 * ============================================================
 */

// --------------- Mock Prisma before requiring service ---------------
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
const {
    updateReportStatusSchema,
} = require('../../../src/backend/src/validations/report.validation');

// --------------- Test Data Factory ---------------

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
    resolvedBy: null,
    ...overrides,
});

// ==================== TEST SUITES ====================

describe('Admin Report Status Update — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. updateReportStatus — Core Status Update Logic
    // --------------------------------------------------
    describe('reportService.updateReportStatus — Status Update Logic', () => {

        test('should throw 404 when report is not found', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            await expect(
                reportService.updateReportStatus('nonexistent-id', 'RESOLVED', null, 'admin-001')
            ).rejects.toThrow('Report not found');
        });

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
    });

    // --------------------------------------------------
    // 2. updateReportStatusSchema — Validation
    // --------------------------------------------------
    describe('updateReportStatusSchema (Zod Validation)', () => {

        test('should accept valid status update', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'RESOLVED',
                adminNotes: 'Investigated and resolved',
            });

            expect(result.success).toBe(true);
        });

        test('should reject invalid status value', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'IN_REVIEW',
            });

            expect(result.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 3. Passenger Visibility — User sees updated status
    // --------------------------------------------------
    describe('Passenger visibility of updated status', () => {

        test('should return reports with updated status for passenger', async () => {
            const updatedReports = [
                createMockReport({ id: 'report-001', status: 'RESOLVED', resolvedById: 'admin-001' }),
            ];
            mockReportFindMany.mockResolvedValue(updatedReports);

            const result = await reportService.getReportsByUser('passenger-001');

            expect(result).toHaveLength(1);
            expect(result[0].status).toBe('RESOLVED');
            expect(mockReportFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { reporterId: 'passenger-001' },
                })
            );
        });
    });
});
