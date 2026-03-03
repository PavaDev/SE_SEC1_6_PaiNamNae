/*
 * Run test:
 * npx jest tests/backend/integrate/passengerGetNotify.integration.test.js --verbose --forceExit
 */
/**
 * ============================================================
 * INTEGRATION TESTS — Passenger Get Notification (Notify Only)
 * ============================================================
 * Test Level  : Integration (Supertest)
 * User Story  : As a passenger, I want to get a notification
 *               when the driver is about to pick me up so that I can get
 *               myself ready or respond to the driver.
 * File        : tests/backend/integrate/passengerGetNotify.integration.test.js
 * Flow Tested : 
 *   - Only driver notifies the passenger of arrival.
 * ============================================================
 */

const request = require('supertest');

// --------------- Mock External Dependencies ---------------

// 1. Mock Prisma
const mockBookingFindUnique = jest.fn();
const mockDriverVerificationFindUnique = jest.fn();

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    booking: {
        findUnique: mockBookingFindUnique,
    },
    driverVerification: {
        findUnique: mockDriverVerificationFindUnique,
    }
}));

// 2. Mock Socket.io
const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));
const mockGetIO = jest.fn(() => ({ to: mockTo }));

jest.mock('../../../src/backend/src/socket', () => ({
    getIO: mockGetIO,
}));

// 3. Mock JWT verification
jest.mock('../../../src/backend/src/utils/jwt', () => ({
    verifyToken: jest.fn((token) => {
        if (token === 'driver-token') {
            return { sub: 'clx1234560000000000driver', role: 'DRIVER' };
        }
        if (token === 'invalid-driver-token') {
            return { sub: 'user-999', role: 'DRIVER' };
        }
        throw new Error('Invalid token');
    }),
}));

// --------------- Build Express App ---------------

let app;

beforeAll(() => {
    const express = require('express');
    const cors = require('cors');
    const routes = require('../../../src/backend/src/routes');
    const { errorHandler } = require('../../../src/backend/src/middlewares/errorHandler');

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', routes);
    app.use(errorHandler);
});

// --------------- Test Data ---------------

const mockDriver = {
    id: 'clx1234560000000000driver',
    firstName: 'สมหมาย',
    lastName: 'สายลุย',
};

const mockPassenger = {
    id: 'clx1234560000000000passen',
    firstName: 'สมศรี',
    lastName: 'ใจดี',
};

const routeId = 'clx12345600000000000route';
const bookingId = 'clx123456000000000booking';

const createMockBooking = (overrides = {}) => ({
    id: bookingId,
    passengerId: mockPassenger.id,
    routeId: routeId,
    status: 'CONFIRMED',
    route: {
        id: routeId,
        driverId: mockDriver.id,
        driver: mockDriver,
    },
    ...overrides,
});

// ==================== TEST SUITES ====================

describe('Passenger Get Notification — Notify Arrival Only', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default: driver is verified
        mockDriverVerificationFindUnique.mockResolvedValue({
            userId: mockDriver.id,
            status: 'APPROVED'
        });
    });

    describe('PATCH /api/bookings/:id/notify-arrival', () => {

        test('should return 200 and emit socket event when driver sends notification (Success)', async () => {
            const booking = createMockBooking({ status: 'CONFIRMED' });
            mockBookingFindUnique.mockResolvedValue(booking);

            const res = await request(app)
                .patch(`/api/bookings/${booking.id}/notify-arrival`)
                .set('Authorization', 'Bearer driver-token')
                .send({ minutes: 5 });

            // 1. Check HTTP Response
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // 2. Check Database Query
            expect(mockBookingFindUnique).toHaveBeenCalledWith({
                where: { id: booking.id },
                include: {
                    route: {
                        include: {
                            driver: { select: { firstName: true, lastName: true } },
                        },
                    },
                },
            });

            // 3. Check Socket Emission
            expect(mockGetIO).toHaveBeenCalled();
            expect(mockTo).toHaveBeenCalledWith(`user:${mockPassenger.id}`);
            expect(mockEmit).toHaveBeenCalledWith('booking:driverArriving', {
                bookingId: booking.id,
                routeId: booking.routeId,
                minutes: 5,
                driverName: `${mockDriver.firstName} ${mockDriver.lastName}`,
            });
        });

        test('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .patch(`/api/bookings/${bookingId}/notify-arrival`)
                .send({ minutes: 5 });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(mockEmit).not.toHaveBeenCalled();
        });

        test('should return 403 when user is not a verified driver', async () => {
            // Mock rejected verification
            mockDriverVerificationFindUnique.mockResolvedValue({
                userId: mockDriver.id,
                status: 'REJECTED'
            });

            const res = await request(app)
                .patch(`/api/bookings/${bookingId}/notify-arrival`)
                .set('Authorization', 'Bearer driver-token')
                .send({ minutes: 5 });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/คุณต้องยืนยันตัวตน/);
            expect(mockEmit).not.toHaveBeenCalled();
        });

        test('should return 404 when booking is not found', async () => {
            mockBookingFindUnique.mockResolvedValue(null);

            const res = await request(app)
                .patch(`/api/bookings/${bookingId}/notify-arrival`)
                .set('Authorization', 'Bearer driver-token')
                .send({ minutes: 10 });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Booking not found');
            expect(mockEmit).not.toHaveBeenCalled();
        });

        test('should return 403 when the requester is not the driver of the route', async () => {
            const booking = createMockBooking();
            mockBookingFindUnique.mockResolvedValue(booking);

            // Allow the other user to pass the driver verification middleware
            mockDriverVerificationFindUnique.mockResolvedValue({
                userId: 'user-999',
                status: 'APPROVED'
            });

            const res = await request(app)
                .patch(`/api/bookings/${booking.id}/notify-arrival`)
                .set('Authorization', 'Bearer invalid-driver-token') // sub: 'user-999'
                .send({ minutes: 5 });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Forbidden');
            expect(mockEmit).not.toHaveBeenCalled();
        });

        test('should return 400 when booking status is not CONFIRMED or IN_TRANSIT', async () => {
            // driver hits the API but booking is still PENDING
            const booking = createMockBooking({ status: 'PENDING' });
            mockBookingFindUnique.mockResolvedValue(booking);

            const res = await request(app)
                .patch(`/api/bookings/${booking.id}/notify-arrival`)
                .set('Authorization', 'Bearer driver-token')
                .send({ minutes: 2 });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('สามารถแจ้งเตือนได้เฉพาะผู้โดยสารที่ยืนยันแล้วหรือกำลังเดินทางเท่านั้น');
            expect(mockEmit).not.toHaveBeenCalled();
        });

        test('should return 400 (Validation Error) if minutes is not provided', async () => {
            const res = await request(app)
                .patch(`/api/bookings/${bookingId}/notify-arrival`)
                .set('Authorization', 'Bearer driver-token')
                .send({}); // Missing minutes

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(mockEmit).not.toHaveBeenCalled();
        });
    });
});
