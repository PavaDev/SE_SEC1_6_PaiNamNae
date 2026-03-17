/*
 * Run test (from code/backend/):
 * npx jest test/backend/integrate/report.integration.test.js --verbose --forceExit
 */
/**
 * ============================================================
 * INTEGRATION TESTS — Report Feature (API)
 * ============================================================
 * Test Level  : Integration (Supertest)
 * User Story  : As a passenger, I want to report the driver's
 *               behavior to the administrator and receive
 *               updates about the reported case.
 * Scenarios (based on report_new.robot):
 *   1–8.  POST /api/reports — In-trip report  (text/image/audio/video combos)
 *   9–10. POST /api/reports — After-trip report from myTrip history
 *   11.   GET  /api/reports/me           — Passenger views own reports
 *   12.   GET  /api/reports/booking/:id  — Duplicate report check
 *   13–15.POST /api/reports — Error cases (validation, auth)
 * ============================================================
 */

const request = require('supertest');

// --------------- Mock External Dependencies ---------------

const mockReportCreate = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportFindFirst = jest.fn();

jest.mock('../../../code/backend/src/utils/prisma', () => ({
    report: { create: mockReportCreate, findMany: mockReportFindMany, findFirst: mockReportFindFirst },
    notification: { create: jest.fn().mockResolvedValue({}) },
}));

const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));
jest.mock('../../../code/backend/src/socket', () => ({ getIO: jest.fn(() => ({ to: mockTo })) }));
jest.mock('../../../code/backend/src/utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({ url: 'https://cloudinary.example.com/file.jpg' }),
}));
jest.mock('../../../code/backend/src/utils/jwt', () => ({
    verifyToken: jest.fn((token) => {
        if (token === 'passenger-token') return { sub: 'passenger-001', role: 'PASSENGER' };
        throw new Error('Invalid token');
    }),
}));

// --------------- Build Express App ---------------

let app;
beforeAll(() => {
    const express = require('express');
    const routes = require('../../../code/backend/src/routes');
    const { errorHandler } = require('../../../code/backend/src/middlewares/errorHandler');
    app = express();
    app.use(express.json());
    app.use('/api', routes);
    app.use(errorHandler);
});

// --------------- Shared Test Data ---------------

const DRIVER_ID = 'driver-001';
const PASSENGER_ID = 'passenger-001';
const routeId = 'route-001';
const bookingId = 'booking-001';

const mockDriver = { id: DRIVER_ID, firstName: 'สมหมาย', lastName: 'สายลุย', email: 'driver@test.com', profilePicture: null };
const mockPassenger = { id: PASSENGER_ID, firstName: 'สมศรี', lastName: 'ใจดี', email: 'passenger1@test.com', profilePicture: null };

const buildReport = (overrides = {}) => ({
    id: 'report-int-001',
    reporterId: PASSENGER_ID,
    type: 'DRIVER',
    category: 'SAFETY_ISSUE',
    description: 'คนขับขับรถอันตรายมากครับ',
    images: null,
    status: 'PENDING',
    adminNotes: null,
    routeId, bookingId,
    targetUserId: DRIVER_ID,
    resolvedAt: null, resolvedById: null,
    createdAt: new Date('2026-03-17T10:00:00Z'),
    reporter: mockPassenger, targetUser: mockDriver,
    route: { id: routeId, driver: mockDriver },
    booking: { id: bookingId, status: 'CONFIRMED', numberOfSeats: 1 },
    resolvedBy: null,
    ...overrides,
});

const baseBody = { type: 'DRIVER', category: 'SAFETY_ISSUE', description: 'คนขับขับรถอันตรายมากครับ', routeId, bookingId, targetUserId: DRIVER_ID };

const AUTH = 'Bearer passenger-token';

/** Helper: attach fake files by name list (image/audio/video) to a supertest request */
const attachFiles = (req, fileTypes) => {
    const fileMap = {
        IMAGE: { name: 'picture.jpg', type: 'image/jpeg', data: 'fake-image' },
        AUDIO: { name: 'sound.mp3', type: 'audio/mpeg', data: 'fake-audio' },
        VIDEO: { name: 'video.mp4', type: 'video/mp4', data: 'fake-video' },
    };
    fileTypes.forEach((t) => {
        const f = fileMap[t];
        req.attach('images', Buffer.from(f.data), { filename: f.name, contentType: f.type });
    });
    return req;
};

// ==================== TEST SUITES ====================

describe('Report API — Integration Tests (Passenger reports Driver)', () => {
    beforeEach(() => jest.clearAllMocks());

    // ──────────────────────────────────────────────────────────────────
    // Scenarios 1–8: POST /api/reports — In-trip reports (media combos)
    // ──────────────────────────────────────────────────────────────────
    describe('POST /api/reports — In-trip report (Scenarios 1–8)', () => {

        test('Scenario 1: TEXT only → 201, PENDING status, correct relationships', async () => {
            mockReportCreate.mockResolvedValue(buildReport());

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', AUTH)
                .send(baseBody);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toMatchObject({
                reporterId: PASSENGER_ID,
                targetUserId: DRIVER_ID,
                type: 'DRIVER',
                category: 'SAFETY_ISSUE',
                status: 'PENDING',
            });
            expect(mockReportCreate).toHaveBeenCalledTimes(1);
        });

        // Scenarios 2–8: file upload combos
        test.each([
            ['2', 'IMAGE', ['IMAGE'], 1],
            ['3', 'AUDIO', ['AUDIO'], 1],
            ['4', 'VIDEO', ['VIDEO'], 1],
            ['5', 'IMAGE + VIDEO', ['IMAGE', 'VIDEO'], 2],
            ['6', 'IMAGE + AUDIO', ['IMAGE', 'AUDIO'], 2],
            ['7', 'VIDEO + AUDIO', ['VIDEO', 'AUDIO'], 2],
            ['8', 'IMAGE+VIDEO+AUDIO', ['IMAGE', 'VIDEO', 'AUDIO'], 3],
        ])('Scenario %s: %s → 201 with %i file URL(s)', async (_num, _label, fileTypes, fileCount) => {
            const imageUrls = Array.from({ length: fileCount }, (_, i) =>
                `https://cloudinary.example.com/file${i}.jpg`
            );
            mockReportCreate.mockResolvedValue(buildReport({ images: imageUrls }));

            const req = request(app)
                .post('/api/reports')
                .set('Authorization', AUTH)
                .field('type', baseBody.type)
                .field('category', baseBody.category)
                .field('description', `คนขับขับรถอันตรายมากครับ (${_label})`)
                .field('routeId', routeId)
                .field('bookingId', bookingId)
                .field('targetUserId', DRIVER_ID);

            attachFiles(req, fileTypes);
            const res = await req;

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.images).toHaveLength(fileCount);
        });
    });

    // ──────────────────────────────────────────────────────────────────
    // Scenarios 9–10: POST /api/reports — After-trip report (myTrip)
    // ──────────────────────────────────────────────────────────────────
    describe('POST /api/reports — After-trip report from myTrip (Scenarios 9–10)', () => {

        test('Scenario 9: TEXT → 201, reporterId is passenger', async () => {
            mockReportCreate.mockResolvedValue(buildReport({ description: 'รายงานย้อนหลัง: คนขับขับรถอันตรายมากครับ' }));

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', AUTH)
                .send({ ...baseBody, description: 'รายงานย้อนหลัง: คนขับขับรถอันตรายมากครับ' });

            expect(res.status).toBe(201);
            expect(res.body.data.reporterId).toBe(PASSENGER_ID);
        });

        test('Scenario 10: IMAGE → 201 with image URL stored', async () => {
            mockReportCreate.mockResolvedValue(buildReport({ images: ['https://cloudinary.example.com/file.jpg'] }));

            const req = request(app)
                .post('/api/reports')
                .set('Authorization', AUTH)
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'รายงานย้อนหลัง: คนขับขับรถอันตรายมากครับ (IMAGE)')
                .field('routeId', routeId)
                .field('bookingId', bookingId)
                .field('targetUserId', DRIVER_ID);

            attachFiles(req, ['IMAGE']);
            const res = await req;

            expect(res.status).toBe(201);
            expect(res.body.data.images).toHaveLength(1);
        });
    });

    // ──────────────────────────────────────────────────────────────────
    // Scenario 11: GET /api/reports/me — Passenger views own reports
    // ──────────────────────────────────────────────────────────────────
    describe('GET /api/reports/me — Passenger views their reports (Scenario 11)', () => {

        test('Scenario 11: → 200, returns own reports array, queried by passengerId', async () => {
            mockReportFindMany.mockResolvedValue([buildReport(), buildReport({ id: 'report-002', status: 'APPROVED' })]);

            const res = await request(app)
                .get('/api/reports/me')
                .set('Authorization', AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(mockReportFindMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { reporterId: PASSENGER_ID } })
            );
        });
    });

    // ──────────────────────────────────────────────────────────────────
    // Scenario 12: GET /api/reports/booking/:id — Duplicate check
    // ──────────────────────────────────────────────────────────────────
    describe('GET /api/reports/booking/:bookingId — Duplicate check (Scenario 12)', () => {

        test('Scenario 12: hasReport=true when report already exists for booking', async () => {
            mockReportFindFirst.mockResolvedValue(buildReport());

            const res = await request(app)
                .get(`/api/reports/booking/${bookingId}`)
                .set('Authorization', AUTH);

            expect(res.status).toBe(200);
            expect(res.body.hasReport).toBe(true);
            expect(mockReportFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.objectContaining({ bookingId, reporterId: PASSENGER_ID }) })
            );
        });

        test('hasReport=false when no report exists yet', async () => {
            mockReportFindFirst.mockResolvedValue(null);

            const res = await request(app)
                .get(`/api/reports/booking/${bookingId}`)
                .set('Authorization', AUTH);

            expect(res.status).toBe(200);
            expect(res.body.hasReport).toBe(false);
        });
    });

    // ──────────────────────────────────────────────────────────────────
    // Scenarios 13–15: Error cases
    // ──────────────────────────────────────────────────────────────────
    describe('POST /api/reports — Error cases (Scenarios 13–15)', () => {

        test('Scenario 13: Missing "type" → 400 Validation Error', async () => {
            const { type, ...noType } = baseBody;
            const res = await request(app).post('/api/reports').set('Authorization', AUTH).send(noType);
            expect(res.status).toBe(400);
            expect(mockReportCreate).not.toHaveBeenCalled();
        });

        test('Scenario 14: Description too short (< 5 chars) → 400 Validation Error', async () => {
            const res = await request(app).post('/api/reports').set('Authorization', AUTH).send({ ...baseBody, description: 'bad' });
            expect(res.status).toBe(400);
            expect(mockReportCreate).not.toHaveBeenCalled();
        });

        test('Scenario 15: No auth token → 401 Unauthorized', async () => {
            const res = await request(app).post('/api/reports').send(baseBody);
            expect(res.status).toBe(401);
            expect(mockReportCreate).not.toHaveBeenCalled();
        });
    });
});
