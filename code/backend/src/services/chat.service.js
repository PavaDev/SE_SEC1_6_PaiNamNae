const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../socket');

/**
 * Verify that a user has access to a trip's chat:
 * - DRIVER owns the route
 * - PASSENGER has an active booking on it
 */
async function verifyTripAccess(routeId, userId) {
    const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: {
            id: true,
            driverId: true,
            status: true,
            bookings: {
                where: { passengerId: userId },
                select: { id: true, status: true }
            }
        }
    });

    if (!route) throw new ApiError(404, 'Route not found');

    const isDriver = route.driverId === userId;
    const isPassenger = route.bookings.length > 0;

    if (!isDriver && !isPassenger) {
        throw new ApiError(403, 'คุณไม่มีสิทธิ์เข้าถึง chat ของทริปนี้');
    }

    // Guard: Prevent chatting if trip is completed or cancelled
    if (['COMPLETED', 'CANCELLED'].includes(route.status)) {
        throw new ApiError(400, 'ทริปนี้สิ้นสุดลงแล้ว ไม่สามารถส่งข้อความได้');
    }

    return { isDriver, isPassenger };
}

/**
 * Get all messages for a trip route
 */
const getMessages = async (routeId, userId) => {
    await verifyTripAccess(routeId, userId);

    return prisma.tripMessage.findMany({
        where: { routeId },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                }
            }
        }
    });
};

/**
 * Send a message — save to DB then broadcast via socket
 */
const sendMessage = async (routeId, userId, text, metadata = null) => {
    const { isDriver } = await verifyTripAccess(routeId, userId);
    const senderRole = isDriver ? 'DRIVER' : 'PASSENGER';

    const message = await prisma.tripMessage.create({
        data: {
            routeId,
            senderId: userId,
            senderRole,
            text,
            isSystem: false,
            metadata: metadata || undefined
        },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                }
            }
        }
    });

    // Broadcast realtime via socket to the trip room
    try {
        const io = getIO();
        io.to(`trip:${routeId}`).emit('trip:message', message);
    } catch (e) {
        console.error('[Socket] Failed to emit trip:message:', e.message);
    }

    // Also trigger web push for the other party
    try {
        const { sendPushToUser } = require('./webpush.service');
        // Find the recipient: if sender is driver → send to all passengers; if passenger → send to driver
        const route = await prisma.route.findUnique({
            where: { id: routeId },
            select: { driverId: true, bookings: { where: { status: { in: ['CONFIRMED', 'IN_TRANSIT'] } }, select: { passengerId: true } } }
        });
        if (route) {
            if (isDriver) {
                // notify all active passengers
                for (const b of route.bookings) {
                    await sendPushToUser(b.passengerId, {
                        title: '💬 ข้อความจากคนขับ',
                        body: text.length > 80 ? text.slice(0, 77) + '...' : text,
                        url: '/current-trip',
                    }).catch(() => {});
                }
            } else {
                // notify driver
                await sendPushToUser(route.driverId, {
                    title: '💬 ข้อความจากผู้โดยสาร',
                    body: text.length > 80 ? text.slice(0, 77) + '...' : text,
                    url: '/current-trip',
                }).catch(() => {});
            }
        }
    } catch (e) {
        // Non-fatal — web push may not be set up
    }

    return message;
};

/**
 * Send a system message (arrival notification etc.) — called internally, no access check
 */
const sendSystemMessage = async (routeId, senderId, senderRole, text, metadata = null) => {
    const message = await prisma.tripMessage.create({
        data: {
            routeId,
            senderId,
            senderRole,
            text,
            isSystem: true,
            metadata: metadata || undefined
        },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                }
            }
        }
    });

    try {
        const io = getIO();
        io.to(`trip:${routeId}`).emit('trip:message', message);
    } catch (e) {
        console.error('[Socket] Failed to emit trip:message (system):', e.message);
    }

    return message;
};

module.exports = { getMessages, sendMessage, sendSystemMessage };
