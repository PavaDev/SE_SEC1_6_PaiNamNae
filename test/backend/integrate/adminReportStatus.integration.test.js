/*
 * Run test:
 * npx jest test/backend/integrate/adminReportStatus.integration.test.js --verbose --forceExit
 */
/**
 * ============================================================
 * INTEGRATION TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStatus
 * Test Level  : Integration (Service ↔ Database layer)
 * User Story  : As an admin, I want to update the status of
 *               user-reported incidents (APPROVED / RESOLVED /
 *               REJECTED / PENDING) so that reporters are kept
 *               informed about their cases.
 * Mirrors     : adminReportStatus_new.robot (Scenarios 1–4)
 * ============================================================
 *
 * API under test:
 *   PATCH /api/reports/admin/:id
 *   Body: { status: 'APPROVED'|'RESOLVED'|'REJECTED'|'PENDING', adminNotes?: string }
 *
 * What is tested (Service ↔ DB layer):
 *   1. Admin updates PENDING → APPROVED   → resolvedAt / resolvedById set
 *   2. Admin updates PENDING → RESOLVED   → resolvedAt / resolvedById set
 *   3. Admin updates PENDING → REJECTED   → resolvedAt / resolvedById set
 *   4. Admin resets report  → PENDING     → resolvedAt / resolvedById NOT set
 *   5. Reporter (driver) retrieves updated status via getReportsByUser
 *   6. Admin can fetch report list filtered by status
 *   7. Error: update non-existent report → throws 404
 *   8. Error: getReportsByUser returns empty when no reports
 * ============================================================
 */

// ─────────────────────────────────────────────────────────
// Mock: Prisma client
// ─────────────────────────────────────────────────────────
const mockReportFindUnique = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportUpdate = jest.fn();
const mockReportCount = jest.fn();
const mockNotificationCreate = jest.fn();

jest.mock('../../../code/backend/src/utils/prisma', () => ({
    report: {
        findUnique: mockReportFindUnique,
        findMany: mockReportFindMany,
        findFirst: mockReportFindFirst,
        update: mockReportUpdate,
        count: mockReportCount,
    },
    notification: {
        create: mockNotificationCreate,
    },
}));

const reportService = require('../../../code/backend/src/services/report.service');

// ─────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────
const mockAdmin = {
    id: 'admin-001',
    firstName: 'Admin',
    lastName: 'User',
};

const mockDriver = {
    id: 'driver-001',
    firstName: 'John',
    lastName: 'Driver',
    email: 'driver@test.com',
    profilePicture: null,
};

const mockPassenger = {
    id: 'passenger-001',
    firstName: 'Jane',
    lastName: 'Passenger',
    email: 'passenger1@test.com',
    profilePicture: null,
};

const mockRoute = {
    id: 'route-001',
    startLocation: { name: 'ขอนแก่น', lat: 16.4419, lng: 102.8360 },
    endLocation: { name: 'สุรินทร์', lat: 14.8845, lng: 103.4930 },
    departureTime: new Date('2026-03-18T09:00:00Z'),
    driver: mockDriver,
    vehicle: { id: 'v-001', vehicleModel: 'Toyota Camry', licensePlate: 'กข 1234', color: 'ขาว' },
};

/** Factory: สร้าง mock report ใหม่พร้อม overrides */
const createMockReport = (overrides = {}) => ({
    id: 'report-001',
    reporterId: mockDriver.id,       // driver เป็นผู้รายงาน
    targetUserId: null,
    type: 'DRIVER',
    category: 'SAFETY_ISSUE',
    description: 'คนขับขับรถอันตรายมากครับ',
    images: null,
    status: 'PENDING',
    adminNotes: null,
    routeId: mockRoute.id,
    bookingId: 'booking-001',
    resolvedAt: null,
    resolvedById: null,
    createdAt: new Date('2026-03-17T10:00:00Z'),
    updatedAt: new Date('2026-03-17T10:00:00Z'),
    reporter: mockDriver,
    targetUser: null,
    route: mockRoute,
    booking: { id: 'booking-001', status: 'CONFIRMED', numberOfSeats: 1 },
    resolvedBy: null,
    ...overrides,
});

// ─────────────────────────────────────────────────────────
// Test Suites
// ─────────────────────────────────────────────────────────
describe('Admin Report Status Update — Integration Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: notification.create resolves silently
        mockNotificationCreate.mockResolvedValue({});
    });

    // ══════════════════════════════════════════════════════
    // Suite 1: Admin updates status to APPROVED
    // Mirrors Robot Scenario 1
    // ══════════════════════════════════════════════════════
    describe('1. Admin Updates Status → APPROVED (รับเรื่อง)', () => {

        test('should update PENDING → APPROVED and set resolvedAt / resolvedById', async () => {
            const pending = createMockReport({ status: 'PENDING' });
            const approved = createMockReport({
                status: 'APPROVED',
                adminNotes: 'รับเรื่องแล้ว กำลังดำเนินการตรวจสอบ',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
                resolvedBy: mockAdmin,
            });

            mockReportFindUnique.mockResolvedValue(pending);
            mockReportUpdate.mockResolvedValue(approved);

            const result = await reportService.updateReportStatus(
                'report-001', 'APPROVED', 'รับเรื่องแล้ว กำลังดำเนินการตรวจสอบ', mockAdmin.id
            );

            // ตรวจสถานะที่ return มา
            expect(result.status).toBe('APPROVED');
            expect(result.adminNotes).toBe('รับเรื่องแล้ว กำลังดำเนินการตรวจสอบ');
            expect(result.resolvedAt).toBeInstanceOf(Date);
            expect(result.resolvedById).toBe(mockAdmin.id);
        });

        test('should call prisma.report.update with status=APPROVED and resolvedAt/resolvedById', async () => {
            mockReportFindUnique.mockResolvedValue(createMockReport({ status: 'PENDING' }));
            mockReportUpdate.mockResolvedValue(createMockReport({
                status: 'APPROVED', resolvedAt: new Date(), resolvedById: mockAdmin.id,
            }));

            await reportService.updateReportStatus('report-001', 'APPROVED', 'รับเรื่องแล้ว', mockAdmin.id);

            expect(mockReportUpdate).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'report-001' },
                data: expect.objectContaining({
                    status: 'APPROVED',
                    resolvedAt: expect.any(Date),
                    resolvedById: mockAdmin.id,
                }),
            }));
        });

        test('should create a notification for the reporter after APPROVED update', async () => {
            mockReportFindUnique.mockResolvedValue(createMockReport({ status: 'PENDING' }));
            mockReportUpdate.mockResolvedValue(createMockReport({
                status: 'APPROVED', resolvedAt: new Date(), resolvedById: mockAdmin.id,
            }));

            await reportService.updateReportStatus('report-001', 'APPROVED', null, mockAdmin.id);

            expect(mockNotificationCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: mockDriver.id,
                    type: 'SYSTEM',
                    title: 'อัปเดตสถานะรายงาน',
                }),
            }));
        });
    });

    // ══════════════════════════════════════════════════════
    // Suite 2: Admin updates status to RESOLVED
    // Mirrors Robot Scenario 2
    // ══════════════════════════════════════════════════════
    describe('2. Admin Updates Status → RESOLVED (แก้ไขแล้ว)', () => {

        test('should update PENDING → RESOLVED and set resolvedAt / resolvedById', async () => {
            const pending = createMockReport({ status: 'PENDING' });
            const resolved = createMockReport({
                status: 'RESOLVED',
                adminNotes: 'ดำเนินการแก้ไขเรียบร้อยแล้ว',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
                resolvedBy: mockAdmin,
            });

            mockReportFindUnique.mockResolvedValue(pending);
            mockReportUpdate.mockResolvedValue(resolved);

            const result = await reportService.updateReportStatus(
                'report-001', 'RESOLVED', 'ดำเนินการแก้ไขเรียบร้อยแล้ว', mockAdmin.id
            );

            expect(result.status).toBe('RESOLVED');
            expect(result.resolvedAt).toBeInstanceOf(Date);
            expect(result.resolvedById).toBe(mockAdmin.id);
            expect(result.resolvedBy).toBeDefined();
            expect(result.resolvedBy.id).toBe(mockAdmin.id);
        });

        test('should call prisma.report.update with status=RESOLVED and resolvedAt/resolvedById', async () => {
            mockReportFindUnique.mockResolvedValue(createMockReport({ status: 'PENDING' }));
            mockReportUpdate.mockResolvedValue(createMockReport({
                status: 'RESOLVED', resolvedAt: new Date(), resolvedById: mockAdmin.id,
            }));

            await reportService.updateReportStatus('report-001', 'RESOLVED', 'แก้ไขเรียบร้อย', mockAdmin.id);

            expect(mockReportUpdate).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'report-001' },
                data: expect.objectContaining({
                    status: 'RESOLVED',
                    resolvedAt: expect.any(Date),
                    resolvedById: mockAdmin.id,
                }),
            }));
        });

        test('should create a notification for the reporter after RESOLVED update', async () => {
            mockReportFindUnique.mockResolvedValue(createMockReport({ status: 'PENDING' }));
            mockReportUpdate.mockResolvedValue(createMockReport({
                status: 'RESOLVED', resolvedAt: new Date(), resolvedById: mockAdmin.id,
            }));

            await reportService.updateReportStatus('report-001', 'RESOLVED', 'แก้ไขแล้ว', mockAdmin.id);

            expect(mockNotificationCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: mockDriver.id,
                    title: 'อัปเดตสถานะรายงาน',
                }),
            }));
        });
    });

    // ══════════════════════════════════════════════════════
    // Suite 3: Admin updates status to REJECTED
    // Mirrors Robot Scenario 3
    // ══════════════════════════════════════════════════════
    describe('3. Admin Updates Status → REJECTED (ปฏิเสธ)', () => {

        test('should update PENDING → REJECTED and set resolvedAt / resolvedById', async () => {
            const rejected = createMockReport({
                status: 'REJECTED',
                adminNotes: 'ไม่พบหลักฐานเพียงพอในการดำเนินการ',
                resolvedAt: new Date(),
                resolvedById: mockAdmin.id,
                resolvedBy: mockAdmin,
            });

            mockReportFindUnique.mockResolvedValue(createMockReport({ status: 'PENDING' }));
            mockReportUpdate.mockResolvedValue(rejected);

            const result = await reportService.updateReportStatus(
                'report-001', 'REJECTED', 'ไม่พบหลักฐานเพียงพอในการดำเนินการ', mockAdmin.id
            );

            expect(result.status).toBe('REJECTED');
            expect(result.resolvedAt).toBeInstanceOf(Date);
            expect(result.resolvedById).toBe(mockAdmin.id);
        });

        test('should call prisma.report.update with status=REJECTED and resolvedAt/resolvedById', async () => {
            mockReportFindUnique.mockResolvedValue(createMockReport({ status: 'PENDING' }));
            mockReportUpdate.mockResolvedValue(createMockReport({
                status: 'REJECTED', resolvedAt: new Date(), resolvedById: mockAdmin.id,
            }));

            await reportService.updateReportStatus('report-001', 'REJECTED', 'ปฏิเสธแล้ว', mockAdmin.id);

            expect(mockReportUpdate).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'report-001' },
                data: expect.objectContaining({
                    status: 'REJECTED',
                    resolvedAt: expect.any(Date),
                    resolvedById: mockAdmin.id,
                }),
            }));
        });
    });

    // ══════════════════════════════════════════════════════
    // Suite 4: Admin resets report back to PENDING
    // Mirrors Robot Scenario 4
    // ══════════════════════════════════════════════════════
    describe('4. Admin Updates Status → PENDING (รอพิจารณา)', () => {

        test('should update APPROVED → PENDING and NOT set resolvedAt / resolvedById', async () => {
            const pending = createMockReport({
                status: 'PENDING',
                adminNotes: 'ต้องการข้อมูลเพิ่มเติม',
                resolvedAt: null,
                resolvedById: null,
            });

            mockReportFindUnique.mockResolvedValue(createMockReport({ status: 'APPROVED' }));
            mockReportUpdate.mockResolvedValue(pending);

            const result = await reportService.updateReportStatus(
                'report-001', 'PENDING', 'ต้องการข้อมูลเพิ่มเติม', mockAdmin.id
            );

            expect(result.status).toBe('PENDING');
        });

        test('should call prisma.report.update with status=PENDING and WITHOUT resolvedAt/resolvedById', async () => {
            mockReportFindUnique.mockResolvedValue(createMockReport({ status: 'APPROVED' }));
            mockReportUpdate.mockResolvedValue(createMockReport({ status: 'PENDING' }));

            await reportService.updateReportStatus('report-001', 'PENDING', null, mockAdmin.id);

            const updateCall = mockReportUpdate.mock.calls[0][0];
            expect(updateCall.data.status).toBe('PENDING');
            // ต้องไม่มี resolvedAt / resolvedById สำหรับ PENDING
            expect(updateCall.data.resolvedAt).toBeUndefined();
            expect(updateCall.data.resolvedById).toBeUndefined();
        });
    });

    // ══════════════════════════════════════════════════════
    // Suite 5: Driver retrieves updated status via getReportsByUser
    // (verifies the "Driver sees updated status" flow in Robot tests)
    // ══════════════════════════════════════════════════════
    describe('5. Driver Retrieves Updated Status — getReportsByUser', () => {

        test('should return reports with APPROVED status for the driver', async () => {
            const updatedReports = [
                createMockReport({ status: 'APPROVED', adminNotes: 'รับเรื่องแล้ว กำลังดำเนินการตรวจสอบ' }),
            ];
            mockReportFindMany.mockResolvedValue(updatedReports);

            const result = await reportService.getReportsByUser(mockDriver.id);

            expect(result).toHaveLength(1);
            expect(result[0].status).toBe('APPROVED');
            expect(result[0].adminNotes).toBe('รับเรื่องแล้ว กำลังดำเนินการตรวจสอบ');
        });

        test('should return reports with RESOLVED status for the driver', async () => {
            const updatedReports = [
                createMockReport({
                    status: 'RESOLVED',
                    adminNotes: 'ดำเนินการแก้ไขเรียบร้อยแล้ว',
                    resolvedAt: new Date(),
                    resolvedById: mockAdmin.id,
                    resolvedBy: mockAdmin,
                }),
            ];
            mockReportFindMany.mockResolvedValue(updatedReports);

            const result = await reportService.getReportsByUser(mockDriver.id);

            expect(result).toHaveLength(1);
            expect(result[0].status).toBe('RESOLVED');
            expect(result[0].resolvedBy).toBeDefined();
        });

        test('should return reports with REJECTED status for the driver', async () => {
            const updatedReports = [
                createMockReport({
                    status: 'REJECTED',
                    adminNotes: 'ไม่พบหลักฐานเพียงพอในการดำเนินการ',
                }),
            ];
            mockReportFindMany.mockResolvedValue(updatedReports);

            const result = await reportService.getReportsByUser(mockDriver.id);

            expect(result[0].status).toBe('REJECTED');
        });

        test('should query reports filtered by reporterId and sorted by createdAt desc', async () => {
            mockReportFindMany.mockResolvedValue([createMockReport()]);

            await reportService.getReportsByUser(mockDriver.id);

            expect(mockReportFindMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { reporterId: mockDriver.id },
                orderBy: { createdAt: 'desc' },
            }));
        });

        test('should return empty array when driver has no reports', async () => {
            mockReportFindMany.mockResolvedValue([]);

            const result = await reportService.getReportsByUser(mockDriver.id);

            expect(result).toHaveLength(0);
        });
    });

    // ══════════════════════════════════════════════════════
    // Suite 6: Admin searches/filters reports by status
    // ══════════════════════════════════════════════════════
    describe('6. Admin Searches Reports by Status — searchReports', () => {

        test('should filter reports by status=PENDING', async () => {
            const pendingReport = createMockReport({ status: 'PENDING' });
            mockReportFindMany.mockResolvedValue([pendingReport]);
            mockReportCount.mockResolvedValue(1);

            const result = await reportService.searchReports({ status: 'PENDING' });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].status).toBe('PENDING');
            expect(mockReportFindMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: 'PENDING' }),
            }));
        });

        test('should filter reports by status=APPROVED', async () => {
            const approvedReport = createMockReport({ status: 'APPROVED' });
            mockReportFindMany.mockResolvedValue([approvedReport]);
            mockReportCount.mockResolvedValue(1);

            const result = await reportService.searchReports({ status: 'APPROVED' });

            expect(result.data[0].status).toBe('APPROVED');
        });

        test('should return pagination metadata in response', async () => {
            mockReportFindMany.mockResolvedValue([createMockReport()]);
            mockReportCount.mockResolvedValue(25);

            const result = await reportService.searchReports({ page: 1, limit: 10 });

            expect(result.pagination).toBeDefined();
            expect(result.pagination.total).toBe(25);
            expect(result.pagination.totalPages).toBe(3);
        });

        test('should flatten reporter info (reporterName, reporterEmail) in response', async () => {
            mockReportFindMany.mockResolvedValue([createMockReport()]);
            mockReportCount.mockResolvedValue(1);

            const result = await reportService.searchReports({});

            expect(result.data[0].reporterName).toBe('John Driver');
            expect(result.data[0].reporterEmail).toBe('driver@test.com');
        });
    });

    // ══════════════════════════════════════════════════════
    // Suite 7: Error Handling
    // ══════════════════════════════════════════════════════
    describe('7. Error Handling', () => {

        test('should throw 404 ApiError when report does not exist for updateReportStatus', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            await expect(
                reportService.updateReportStatus('nonexistent-id', 'APPROVED', null, mockAdmin.id)
            ).rejects.toThrow('Report not found');
        });

        test('should not call prisma.report.update when report is not found', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            await expect(
                reportService.updateReportStatus('nonexistent-id', 'RESOLVED', null, mockAdmin.id)
            ).rejects.toThrow();

            expect(mockReportUpdate).not.toHaveBeenCalled();
        });
    });
});
