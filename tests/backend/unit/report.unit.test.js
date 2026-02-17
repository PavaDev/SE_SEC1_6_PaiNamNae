/**
 * ============================================================
 * UNIT TESTS — Report Feature
 * ============================================================
 * Test Level  : Unit
 * User Story  : As a passenger, I want to report the driver's
 *               behavior to the administrator and receive
 *               updates about the reported case.
 * File        : tests/backend/unit/report.unit.test.js
 * Business Rules:
 *   - Passenger can only report after the trip has ended
 *   - Report button disappears after being pressed (one per booking)
 * ============================================================
 */

// --------------- Mock Prisma before requiring service ---------------
const mockReportCreate = jest.fn();
const mockReportFindUnique = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportFindMany = jest.fn();

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    report: {
        create: mockReportCreate,
        findUnique: mockReportFindUnique,
        findFirst: mockReportFindFirst,
        findMany: mockReportFindMany,
    },
}));

const reportService = require('../../../src/backend/src/services/report.service');

// --------------- Test Data Factories ---------------

const createValidReportData = (overrides = {}) => ({
    reporterId: 'passenger-001',
    type: 'DRIVER',
    category: 'SAFETY_ISSUE',
    description: 'The driver was using phone while driving',
    images: null,
    routeId: 'route-001',
    bookingId: 'booking-001',
    targetUserId: 'driver-001',
    ...overrides,
});

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
    ...overrides,
});

// ==================== TEST SUITES ====================

describe('Report Feature — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. Create Report — Passenger reports driver behavior
    //    (only available after trip has ended)
    // --------------------------------------------------
    describe('reportService.createReport', () => {

        test('should create report successfully with valid data', async () => {
            const reportData = createValidReportData();
            const mockResult = createMockReport();
            mockReportCreate.mockResolvedValue(mockResult);

            const result = await reportService.createReport(reportData);

            expect(result).toBeDefined();
            expect(result.id).toBe('report-001');
            expect(result.reporterId).toBe('passenger-001');
            expect(result.type).toBe('DRIVER');
            expect(result.category).toBe('SAFETY_ISSUE');
            expect(result.status).toBe('PENDING');
            expect(mockReportCreate).toHaveBeenCalledTimes(1);
        });

        test('should create report with no image (images is null)', async () => {
            const reportData = createValidReportData({ images: null });
            const mockResult = createMockReport({ images: null });
            mockReportCreate.mockResolvedValue(mockResult);

            const result = await reportService.createReport(reportData);

            expect(result).toBeDefined();
            expect(result.images).toBeNull();
            expect(mockReportCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ images: null }),
                })
            );
        });
    });

    // --------------------------------------------------
    // 2. Duplicate Check — Report button disappears after
    //    being pressed (one report per booking)
    // --------------------------------------------------
    describe('reportService.getReportByBookingId', () => {

        test('should return existing report for a booking (button disappears)', async () => {
            const existingReport = createMockReport();
            mockReportFindFirst.mockResolvedValue(existingReport);

            const result = await reportService.getReportByBookingId('booking-001', 'passenger-001');

            expect(result).toBeDefined();
            expect(result.id).toBe('report-001');
            expect(mockReportFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { bookingId: 'booking-001', reporterId: 'passenger-001' },
                })
            );
        });

        test('should return null when no report exists (button is visible)', async () => {
            mockReportFindFirst.mockResolvedValue(null);

            const result = await reportService.getReportByBookingId('booking-new', 'passenger-001');

            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------
    // 3. Receive Updates — Retrieve single report status
    // --------------------------------------------------
    describe('reportService.getReportById', () => {

        test('should return report with current status', async () => {
            const mockResult = createMockReport();
            mockReportFindUnique.mockResolvedValue(mockResult);

            const result = await reportService.getReportById('report-001');

            expect(result).toBeDefined();
            expect(result.id).toBe('report-001');
            expect(result.status).toBe('PENDING');
            expect(mockReportFindUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'report-001' } })
            );
        });
    });
});
