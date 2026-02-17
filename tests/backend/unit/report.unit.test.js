/**
 * ============================================================
 * UNIT TESTS — Report Feature
 * ============================================================
 * Test Level  : Unit
 * File        : tests/backend/unit/report.unit.test.js
 * Purpose     : Test report creation logic, validation schemas,
 *               image count limit, one-report-per-trip rule,
 *               and status update logic in isolation with
 *               mocked Prisma dependencies.
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
    createReportSchema,
    updateReportStatusSchema,
} = require('../../../src/backend/src/validations/report.validation');

// --------------- Test Data Factories ---------------

/**
 * Creates a valid report data object with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
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

/**
 * Creates a mock report object as returned from Prisma.
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

describe('Report Feature — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. Report Service — createReport
    // --------------------------------------------------
    describe('reportService.createReport', () => {

        /**
         * TEST: Successfully creates a report with correct data
         * Scenario: Passenger submits a valid report — happy path.
         */
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

        /**
         * TEST: Report created with image URLs stores images correctly
         * Business Rule: Images are optional, max 2 allowed.
         */
        test('should create report with image URLs when provided', async () => {
            const imageUrls = [
                'https://res.cloudinary.com/demo/reports/img1.jpg',
                'https://res.cloudinary.com/demo/reports/img2.jpg',
            ];
            const reportData = createValidReportData({ images: imageUrls });
            const mockResult = createMockReport({ images: imageUrls });
            mockReportCreate.mockResolvedValue(mockResult);

            const result = await reportService.createReport(reportData);

            expect(result.images).toEqual(imageUrls);
            expect(result.images).toHaveLength(2);
        });

        /**
         * TEST: Report without images defaults to null
         */
        test('should handle report creation with no images (defaults to null)', async () => {
            const reportData = createValidReportData({ images: undefined });
            const mockResult = createMockReport({ images: null });
            mockReportCreate.mockResolvedValue(mockResult);

            const result = await reportService.createReport(reportData);

            expect(result).toBeDefined();
            expect(result.images).toBeNull();
        });

        /**
         * TEST: Report stores optional fields as null when not provided
         */
        test('should store optional fields as null when not provided', async () => {
            const reportData = createValidReportData({
                routeId: undefined,
                bookingId: undefined,
                targetUserId: undefined,
            });
            const mockResult = createMockReport({
                routeId: null,
                bookingId: null,
                targetUserId: null,
            });
            mockReportCreate.mockResolvedValue(mockResult);

            const result = await reportService.createReport(reportData);

            expect(result.routeId).toBeNull();
            expect(result.bookingId).toBeNull();
            expect(result.targetUserId).toBeNull();
        });
    });

    // --------------------------------------------------
    // 2. Report Service — getReportById
    // --------------------------------------------------
    describe('reportService.getReportById', () => {

        /**
         * TEST: Returns report when found
         */
        test('should return report when it exists', async () => {
            const mockResult = createMockReport();
            mockReportFindUnique.mockResolvedValue(mockResult);

            const result = await reportService.getReportById('report-001');

            expect(result).toBeDefined();
            expect(result.id).toBe('report-001');
            expect(mockReportFindUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'report-001' } })
            );
        });

        /**
         * TEST: Returns null when report does not exist
         */
        test('should return null when report does not exist', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            const result = await reportService.getReportById('nonexistent-id');

            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------
    // 3. Report Service — updateReportStatus
    // --------------------------------------------------
    describe('reportService.updateReportStatus', () => {

        /**
         * TEST: Throws 404 when report not found for status update
         * Business Rule: Cannot update a non-existent report.
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
         * Business Rule: Status transitions must set resolvedAt/resolvedById
         *                for terminal statuses (RESOLVED, APPROVED, REJECTED).
         */
        test('should update status to RESOLVED and set resolvedAt/resolvedById', async () => {
            const existingReport = createMockReport();
            mockReportFindUnique.mockResolvedValue(existingReport);
            mockReportUpdate.mockResolvedValue({
                ...existingReport,
                status: 'RESOLVED',
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
         * TEST: Updates status to PENDING without setting resolvedAt
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
    });

    // --------------------------------------------------
    // 4. Report Service — getReportsByUser (own reports only)
    // --------------------------------------------------
    describe('reportService.getReportsByUser', () => {

        /**
         * TEST: Returns only reports belonging to the requesting user
         * Business Rule: Passenger can read only their own report status.
         */
        test('should return reports filtered by userId', async () => {
            const userReports = [
                createMockReport({ id: 'report-001' }),
                createMockReport({ id: 'report-002' }),
            ];
            mockReportFindMany.mockResolvedValue(userReports);

            const result = await reportService.getReportsByUser('passenger-001');

            expect(result).toHaveLength(2);
            expect(mockReportFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { reporterId: 'passenger-001' },
                })
            );
        });

        /**
         * TEST: Returns empty array when user has no reports
         */
        test('should return empty array when user has no reports', async () => {
            mockReportFindMany.mockResolvedValue([]);

            const result = await reportService.getReportsByUser('passenger-no-reports');

            expect(result).toEqual([]);
        });
    });

    // --------------------------------------------------
    // 5. Report Service — getReportByBookingId (one-report-per-trip)
    // --------------------------------------------------
    describe('reportService.getReportByBookingId', () => {

        /**
         * TEST: Returns existing report for a booking
         * Business Rule: Each trip can only have ONE report from the passenger.
         */
        test('should return existing report for a booking (duplicate check)', async () => {
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

        /**
         * TEST: Returns null when no report exists for the booking
         */
        test('should return null when no report exists for the booking', async () => {
            mockReportFindFirst.mockResolvedValue(null);

            const result = await reportService.getReportByBookingId('booking-new', 'passenger-001');

            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------
    // 6. Zod Validation Schema — createReportSchema
    // --------------------------------------------------
    describe('createReportSchema (Zod Validation)', () => {

        /**
         * TEST: Valid report data passes validation
         */
        test('should accept valid report data', () => {
            const result = createReportSchema.safeParse({
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
                description: 'Driver was speeding and ignoring traffic signals',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Accepts all valid report types
         */
        test('should accept PASSENGER type', () => {
            const result = createReportSchema.safeParse({
                type: 'PASSENGER',
                category: 'PASSENGER_ISSUE',
                description: 'Passenger was rude and left trash in the car',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Invalid report type is rejected
         * Business Rule: Type must be DRIVER or PASSENGER.
         */
        test('should reject invalid report type', () => {
            const result = createReportSchema.safeParse({
                type: 'INVALID_TYPE',
                category: 'SAFETY_ISSUE',
                description: 'Some description here',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Invalid category is rejected
         */
        test('should reject invalid category', () => {
            const result = createReportSchema.safeParse({
                type: 'DRIVER',
                category: 'INVALID_CATEGORY',
                description: 'Some description here',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Description shorter than 5 characters is rejected
         */
        test('should reject description shorter than 5 characters', () => {
            const result = createReportSchema.safeParse({
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
                description: 'Hi',
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toContain('Description must be at least 5 characters');
        });

        /**
         * TEST: Missing required type field is rejected
         */
        test('should reject missing type field', () => {
            const result = createReportSchema.safeParse({
                category: 'SAFETY_ISSUE',
                description: 'Some description here',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Missing required category field is rejected
         */
        test('should reject missing category field', () => {
            const result = createReportSchema.safeParse({
                type: 'DRIVER',
                description: 'Some description here',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Missing required description field is rejected
         */
        test('should reject missing description field', () => {
            const result = createReportSchema.safeParse({
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Optional routeId, bookingId, targetUserId are accepted
         */
        test('should accept report with optional IDs', () => {
            const result = createReportSchema.safeParse({
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
                description: 'Driver behavior report with all optional IDs',
                routeId: 'route-001',
                bookingId: 'booking-001',
                targetUserId: 'driver-001',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Report without optional fields passes validation
         */
        test('should accept report without optional IDs', () => {
            const result = createReportSchema.safeParse({
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
                description: 'Driver behavior report without optional IDs',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Accepts all valid category values
         */
        test('should accept all valid categories', () => {
            const categories = ['VEHICLE_ISSUE', 'PASSENGER_ISSUE', 'ROAD_ISSUE', 'SAFETY_ISSUE', 'PAYMENT_ISSUE', 'OTHER'];

            categories.forEach(category => {
                const result = createReportSchema.safeParse({
                    type: 'DRIVER',
                    category,
                    description: `Report with category ${category}`,
                });
                expect(result.success).toBe(true);
            });
        });
    });

    // --------------------------------------------------
    // 7. Zod Validation Schema — updateReportStatusSchema
    // --------------------------------------------------
    describe('updateReportStatusSchema (Zod Validation)', () => {

        /**
         * TEST: Valid status update passes validation
         */
        test('should accept valid status update', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'RESOLVED',
                adminNotes: 'Investigated and resolved',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Invalid status is rejected
         */
        test('should reject invalid status value', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'INVALID_STATUS',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Admin notes are optional
         */
        test('should accept status update without adminNotes', () => {
            const result = updateReportStatusSchema.safeParse({
                status: 'APPROVED',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Accepts all valid status transitions
         * Business Rule: Status can be PENDING, APPROVED, REJECTED, RESOLVED.
         */
        test('should accept all valid status values', () => {
            const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'];

            statuses.forEach(status => {
                const result = updateReportStatusSchema.safeParse({ status });
                expect(result.success).toBe(true);
            });
        });
    });
});
