const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { RouteStatus, BookingStatus } = require('@prisma/client');
const { checkAndApplyPassengerSuspension } = require('./penalty.service');
const { getIO } = require('../socket');
const { sendArrivalNotificationEmail, sendNoShowEmail } = require('./email.service');

// --- Spam prevention: cooldown Map for arrival notifications ---
// Key: bookingId, Value: timestamp of last notify
const arrivalCooldowns = new Map();
const emergencyTracker = new Map(); // Track timestamps for "spam-allowed" emergency notifications
const ARRIVAL_COOLDOWN_MS = 30 * 1000; // 30 seconds

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_TRANSIT, BookingStatus.COMPLETED];

const searchBookingsAdmin = async (opts = {}) => {
  const {
    page = 1,
    limit = 20,
    q,
    status,
    routeId,
    passengerId,
    driverId,
    createdFrom,
    createdTo,
    routeDepartureFrom,
    routeDepartureTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = opts;

  const where = {
    ...(status && { status }),
    ...(routeId && { routeId }),
    ...(passengerId && { passengerId }),
    ...(createdFrom || createdTo ? {
      createdAt: {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdTo ? { lte: new Date(createdTo) } : {}),
      }
    } : {}),
    ...(driverId || routeDepartureFrom || routeDepartureTo || q ? {
      route: {
        ...(driverId ? { driverId } : {}),
        ...(routeDepartureFrom || routeDepartureTo ? {
          departureTime: {
            ...(routeDepartureFrom ? { gte: new Date(routeDepartureFrom) } : {}),
            ...(routeDepartureTo ? { lte: new Date(routeDepartureTo) } : {}),
          }
        } : {}),
        ...(q ? {
          OR: [
            { routeSummary: { contains: q, mode: 'insensitive' } },
            // ถ้าต้องการค้นทะเบียนรถ/รุ่นรถ
            {
              vehicle: {
                is: {
                  OR: [
                    { licensePlate: { contains: q, mode: 'insensitive' } },
                    { vehicleModel: { contains: q, mode: 'insensitive' } },
                    { vehicleType: { contains: q, mode: 'insensitive' } },
                  ]
                }
              }
            }
          ]
        } : {}),
      }
    } : {}),
    ...(q ? {
      OR: [
        {
          passenger: {
            is: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { username: { contains: q, mode: 'insensitive' } },
              ]
            }
          }
        }
      ]
    } : {})
  };

  const skip = (page - 1) * limit;
  const take = limit;

  const [total, data] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip, take,
      include: {
        passenger: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true, profilePicture: true }
        },
        route: {
          include: {
            driver: { select: { id: true, firstName: true, lastName: true, email: true, isVerified: true } },
            vehicle: { select: { licensePlate: true, vehicleModel: true, vehicleType: true } },
          }
        }
      }
    })
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const adminCreateBooking = async (data) => {
  return prisma.$transaction(async (tx) => {
    const route = await tx.route.findUnique({ where: { id: data.routeId } });
    if (!route) throw new ApiError(404, 'Route not found');

    // ป้องกันการจองให้คนขับเอง
    if (route.driverId === data.passengerId) {
      throw new ApiError(400, 'Driver cannot book their own route.');
    }
    if (route.status !== RouteStatus.AVAILABLE) {
      throw new ApiError(400, 'This route is no longer available.');
    }
    if (route.availableSeats < data.numberOfSeats) {
      throw new ApiError(400, 'Not enough seats available on this route.');
    }

    const booking = await tx.booking.create({
      data: {
        routeId: data.routeId,
        passengerId: data.passengerId,
        numberOfSeats: data.numberOfSeats,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        // status: (default -> PENDING)
      },
    });

    const updatedRoute = await tx.route.update({
      where: { id: data.routeId },
      data: { availableSeats: { decrement: data.numberOfSeats } },
    });
    if (updatedRoute.availableSeats === 0) {
      await tx.route.update({ where: { id: data.routeId }, data: { status: RouteStatus.FULL } });
    }
    return booking;
  });
};

const adminUpdateBooking = async (id, patch) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({
      where: { id }, include: { route: true }
    });
    if (!existing) throw new ApiError(404, 'Booking not found');

    // ค่าเป้าหมาย
    const targetStatus = patch.status ?? existing.status;
    const oldActive = ACTIVE_STATUSES.includes(existing.status);
    const newActive = ACTIVE_STATUSES.includes(targetStatus);
    const targetRouteId = patch.routeId ?? existing.routeId;
    const targetSeats = patch.numberOfSeats ?? existing.numberOfSeats;
    const targetPassengerId = patch.passengerId ?? existing.passengerId;

    // helper คืนที่นั่งให้ route
    const refundSeats = async (routeId, seats) => {
      const r = await tx.route.update({
        where: { id: routeId },
        data: { availableSeats: { increment: seats } },
      });
      if (r.status === RouteStatus.FULL && r.availableSeats > 0) {
        await tx.route.update({ where: { id: routeId }, data: { status: RouteStatus.AVAILABLE } });
      }
    };
    // helper จองที่นั่งจาก route (ตรวจเงื่อนไข)
    const reserveSeats = async (routeId, seats, passengerId) => {
      const r = await tx.route.findUnique({ where: { id: routeId } });
      if (!r) throw new ApiError(404, 'Route not found');
      if (r.driverId === passengerId) throw new ApiError(400, 'Driver cannot book their own route.');
      if (r.status !== RouteStatus.AVAILABLE) throw new ApiError(400, 'This route is no longer available.');
      if (r.availableSeats < seats) throw new ApiError(400, 'Not enough seats available on this route.');
      const updated = await tx.route.update({
        where: { id: routeId },
        data: { availableSeats: { decrement: seats } },
      });
      if (updated.availableSeats === 0) {
        await tx.route.update({ where: { id: routeId }, data: { status: RouteStatus.FULL } });
      }
    };

    // กรณีเปลี่ยน route/seats หรือเปลี่ยนสถานะระหว่าง active<->inactive
    // ขั้นตอน: ถ้าปัจจุบันถือครองที่นั่งอยู่ (active) → refund ก่อน
    if (oldActive) {
      await refundSeats(existing.routeId, existing.numberOfSeats);
    }
    // จากนั้น ถ้าปลายทางต้องถือครองที่นั่ง (newActive) → reserve ที่ route เป้าหมาย ด้วยจำนวนเป้าหมาย
    if (newActive) {
      await reserveSeats(targetRouteId, targetSeats, targetPassengerId);
    }

    // อัปเดตข้อมูล booking
    const updated = await tx.booking.update({
      where: { id },
      data: {
        routeId: targetRouteId,
        passengerId: targetPassengerId,
        numberOfSeats: targetSeats,
        pickupLocation: patch.pickupLocation ?? existing.pickupLocation,
        dropoffLocation: patch.dropoffLocation ?? existing.dropoffLocation,
        status: targetStatus,
      },
      include: { route: true, passenger: true }
    });
    return updated;
  });
};

const createBooking = async (data, passengerId) => {
  return prisma.$transaction(async (tx) => {

    const route = await tx.route.findUnique({
      where: { id: data.routeId },
    });

    if (!route) {
      throw new ApiError(404, 'Route not found');
    }

    if (route.driverId === passengerId) {
      throw new ApiError(400, 'Driver cannot book their own route.');
    }

    if (route.status !== RouteStatus.AVAILABLE) {
      throw new ApiError(400, 'This route is no longer available.');
    }
    if (route.availableSeats < data.numberOfSeats) {
      throw new ApiError(400, 'Not enough seats available on this route.');
    }

    const booking = await tx.booking.create({
      data: {
        routeId: data.routeId,
        passengerId,
        numberOfSeats: data.numberOfSeats,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
      },
    });

    const updatedRoute = await tx.route.update({
      where: { id: data.routeId },
      data: {
        availableSeats: {
          decrement: data.numberOfSeats,
        },
      },
    });

    if (updatedRoute.availableSeats === 0) {
      await tx.route.update({
        where: { id: data.routeId },
        data: { status: RouteStatus.FULL },
      });
    }

    await tx.notification.create({
      data: {
        userId: route.driverId,
        type: 'BOOKING',
        title: 'มีการจองใหม่ในเส้นทางของคุณ',
        body: 'ผู้โดยสารได้ทำการจองที่นั่งในเส้นทางของคุณแล้ว',
        metadata: {
          kind: 'BOOKING_CREATED',
          bookingId: booking.id,
          routeId: data.routeId,
          passengerId,
          numberOfSeats: data.numberOfSeats
        }
      }
    });

    return booking;
  });
};

const getMyBookings = async (passengerId) => {
  return prisma.booking.findMany({
    where: { passengerId },
    include: {
      review: true,
      route: {
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
              profilePicture: true,
              isVerified: true,
              ratingAverage: true,
              ratingCount: true
            }
          },
          vehicle: {
            select: {
              vehicleModel: true,
              vehicleType: true,
              photos: true,
              amenities: true
            }
          }
        }
      }

    },
    orderBy: { createdAt: 'desc' },
  });
};

const getBookingById = async (id) => {
  return prisma.booking.findUnique({
    where: { id },
    include: { route: true, passenger: true },
  });
};

const updateBookingStatus = async (id, status, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.route.driverId !== userId) {
    throw new ApiError(403, 'Forbidden');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: { status },
    });

    if (status === BookingStatus.REJECTED) {
      // คืนที่นั่งให้ route
      const refunded = booking.numberOfSeats;
      const newSeats = booking.route.availableSeats + refunded;
      const routeUpdates = { availableSeats: newSeats };
      if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
        routeUpdates.status = RouteStatus.AVAILABLE;
      }
      await tx.route.update({
        where: { id: booking.route.id },
        data: routeUpdates,
      });

      await tx.notification.create({
        data: {
          userId: booking.passengerId,
          type: 'BOOKING',
          title: 'คำขอจองถูกปฏิเสธ',
          body: 'ขออภัย คนขับได้ปฏิเสธคำขอจองของคุณ',
          metadata: { kind: 'BOOKING_STATUS', bookingId: id, routeId: booking.route.id, status: 'REJECTED' }
        }
      });

    }

    if (status === BookingStatus.CONFIRMED) {
      // 🔔 แจ้งเตือน Passenger เมื่อถูกยืนยัน
      await tx.notification.create({
        data: {
          userId: booking.passengerId,
          type: 'BOOKING',
          title: 'คำขอจองได้รับการยืนยัน',
          body: 'คนขับได้ยืนยันการจองของคุณแล้ว',
          metadata: { kind: 'BOOKING_STATUS', bookingId: id, routeId: booking.route.id, status: 'CONFIRMED' }
        }
      });
    }
    return updated;
  });
};

const cancelBooking = async (id, passengerId, opts = {}) => {
  const { reason } = opts;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.passengerId !== passengerId) throw new ApiError(403, 'Forbidden');
  if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
    throw new ApiError(400, 'Cannot cancel at this stage');
  }

  const wasConfirmed = booking.status === BookingStatus.CONFIRMED;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: 'PASSENGER',
        cancelReason: reason || null,
      },
    });

    // คืนที่นั่งให้เส้นทาง (เดิม)
    const refunded = booking.numberOfSeats;
    const newSeats = booking.route.availableSeats + refunded;
    const routeUpdates = { availableSeats: newSeats };
    if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
      routeUpdates.status = RouteStatus.AVAILABLE;
    }
    await tx.route.update({
      where: { id: booking.route.id },
      data: routeUpdates,
    });

    if (wasConfirmed) {
      await tx.notification.create({
        data: {
          userId: passengerId,
          type: 'SYSTEM',
          title: 'บันทึกการยกเลิกหลังยืนยัน',
          body: 'คุณได้ยกเลิกการจองที่เคยได้รับการยืนยันแล้ว',
          metadata: { kind: 'PASSENGER_CONFIRMED_CANCEL', bookingId: id },
        },
      });
    }

    // 🔔 แจ้งเตือน Driver เมื่อมีการยกเลิก
    await tx.notification.create({
      data: {
        userId: booking.route.driverId,
        type: 'BOOKING',
        title: 'ผู้โดยสารยกเลิกการจอง',
        body: 'ผู้โดยสารได้ยกเลิกการจองในเส้นทางของคุณ',
        metadata: { kind: 'BOOKING_CANCELLED', bookingId: id, routeId: booking.route.id, cancelledBy: 'PASSENGER' }
      }
    });

    return updatedBooking;
  });

  if (wasConfirmed) {
    await checkAndApplyPassengerSuspension(passengerId, { confirmedOnly: true });
  }

  return updated;
};

const deleteBooking = async (id, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  // if (booking.status !== BookingStatus.REJECTED) {
  //   throw new ApiError(400, 'Only cancelled/rejected bookings can be deleted');
  // }
  if (![BookingStatus.CANCELLED, BookingStatus.REJECTED].includes(booking.status)) {
    throw new ApiError(400, 'Only cancelled or rejected bookings can be deleted');
  }
  if (
    booking.passengerId !== userId &&
    booking.route.driverId !== userId
  ) {
    throw new ApiError(403, 'Forbidden');
  }
  await prisma.booking.delete({ where: { id } });
  return { id };
};

const adminDeleteBooking = async (id) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');

  // แอดมินลบได้ทุกสถานะ แต่ถ้าเป็น PENDING/CONFIRMED ให้คืนที่นั่งให้เส้นทางด้วย
  return prisma.$transaction(async (tx) => {
    if (booking.route) {
      if (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) {
        const refunded = booking.numberOfSeats;
        const newSeats = booking.route.availableSeats + refunded;

        const routeUpdates = { availableSeats: newSeats };
        // ถ้า route เคย FULL แล้วคืนที่นั่ง ทำให้กลับเป็น AVAILABLE
        if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
          routeUpdates.status = RouteStatus.AVAILABLE;
        }
        await tx.route.update({
          where: { id: booking.route.id },
          data: routeUpdates,
        });
      }
    }

    await tx.booking.delete({ where: { id } });
    return { id };
  });
};

module.exports = {
  searchBookingsAdmin,
  adminCreateBooking,
  createBooking,
  adminUpdateBooking,
  adminCreateBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  deleteBooking,
  adminDeleteBooking,
  updatePassengerStatus,
  updateBookingStatus,
  notifyArrival,
  notifyWait,
};

<<<<<<< HEAD
async function notifyArrival(bookingId, minutes, userId, reason) {
=======
async function notifyArrival(bookingId, userId, minutes, customText = null, reason = null) {
  /* --- Spam prevention (Disabled for individual passenger updates) ---
>>>>>>> main
  const now = Date.now();
  const lastLockout = arrivalCooldowns.get(bookingId);

  // Phase 1 Lock: Only applies to NORMAL notifications (no reason)
  if (!reason && lastLockout && (now - lastLockout < 30 * 1000)) {
    throw new ApiError(400, 'คุณส่งข้อมูลถี่เกินไป กรุณารอสักพัก (30 วินาที) ก่อนแจ้งใหม่');
  }

  if (reason) {
    // Phase 2: Emergency mode (Bypasses normal lock, but capped at 3 per 10s)
    let logs = emergencyTracker.get(bookingId) || [];
    logs = logs.filter(t => now - t < 10000);

    if (logs.length >= 3) {
      // Trigger a hard lock if emergency spam limit reached
      arrivalCooldowns.set(bookingId, now); 
      throw new ApiError(400, 'คุณส่งข้อมูลฉุกเฉินถี่เกินไป (3 ครั้ง/10วิ) ระบบล็อกชั่วคราว 30 วินาที');
    }
    
    // Add current timestamp to logs for this emergency
    logs.push(now);
    emergencyTracker.set(bookingId, logs);
  } else {
    // Phase 1: Normal mode -> Immediate 30s cooldown
    arrivalCooldowns.set(bookingId, now);
    emergencyTracker.delete(bookingId); // Reset spam tracker for this booking
  }
  */

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      route: {
        include: {
          driver: { select: { firstName: true, lastName: true } }
        }
      },
      passenger: { select: { id: true, email: true, firstName: true, lastName: true } }
    }
  });

  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.route.driverId !== userId) throw new ApiError(403, 'Forbidden');

  // Guard: Trip must be started (IN_TRANSIT) to notify arrival
  if (booking.route.status !== RouteStatus.IN_TRANSIT) {
    throw new ApiError(400, 'ต้องกดเริ่มการเดินทางก่อนจึงจะสามารถแจ้งเตือนถึงผู้โดยสารได้');
  }

  if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.IN_TRANSIT) {
    throw new ApiError(400, 'สามารถแจ้งเตือนได้เฉพาะผู้โดยสารที่ยืนยันแล้วหรือกำลังเดินทางเท่านั้น');
  }

<<<<<<< HEAD
=======
  // Record cooldown timestamp BEFORE emitting to prevent double-send on concurrent calls
  arrivalCooldowns.set(bookingId, Date.now());

  // --- Check if this is an update ---
  const existingNotification = await prisma.tripMessage.findFirst({
    where: {
      routeId: booking.routeId,
      isSystem: true,
      metadata: {
        path: ['type'],
        equals: 'ARRIVAL'
      },
      AND: {
        metadata: {
          path: ['targetUserId'],
          equals: booking.passengerId
        }
      }
    }
  });
  const isUpdate = !!existingNotification;

>>>>>>> main
  const io = getIO();
  io.to(`user:${booking.passengerId}`).emit('booking:driverArriving', {
    bookingId,
    routeId: booking.routeId,
    minutes,
<<<<<<< HEAD
    reason,
    driverName: `${booking.route.driver.firstName} ${booking.route.driver.lastName}`
=======
    driverName: `${booking.route.driver.firstName} ${booking.route.driver.lastName}`,
    isUpdate,
    reason
>>>>>>> main
  });

  // --- Save system message to TripChat ---
  const driverName = `${booking.route.driver.firstName} ${booking.route.driver.lastName}`;
  const passengerName = booking.passenger.firstName;

  // Format system message with reason if provided
  let systemText = customText;
  if (!systemText) {
    const timeText = minutes === 0 ? 'ถึงจุดนัดพบแล้ว' : `จะถึงจุดรับของคุณในอีกประมาณ ${minutes} นาที`;
    const reasonText = reason ? ` (เหตุผล: ${reason})` : '';
    
    if (isUpdate) {
      systemText = `🔄 @${passengerName} [เเจ้งเปลี่ยนเวลา]: ${timeText}${reasonText}`;
    } else {
      systemText = `🚗 @${passengerName}: ${timeText}${reasonText}`;
    }
  }

  try {
    const chatService = require('./chat.service');
    const metadata = {
      type: 'ARRIVAL',
      targetUserId: booking.passengerId,
      minutes: minutes,
      reason: reason,
      isUpdate: isUpdate
    };
    await chatService.sendSystemMessage(booking.routeId, userId, 'DRIVER', systemText, metadata);
  } catch (e) {
    console.error('[Chat] Failed to save arrival system message:', e.message);
  }

  // --- Web Push to passenger ---
  try {
    const { sendPushToUser } = require('./webpush.service');
    await sendPushToUser(booking.passengerId, {
      title: '🚗 คนขับใกล้ถึงแล้ว!',
      body: `${driverName} จะถึงในอีกประมาณ ${minutes} นาที`,
      url: '/current-trip',
    });
  } catch (e) {
    // Non-fatal
  }

  // Send email asynchronously (don't block the response)
  sendArrivalNotificationEmail(
    booking.passenger,
    booking.route.driver,
    booking,
    minutes,
<<<<<<< HEAD
=======
    isUpdate,
>>>>>>> main
    reason
  ).catch(err => console.error('[Email] sendArrivalNotificationEmail failed:', err.message));

  return { success: true };
}

async function updatePassengerStatus(id, status, userId, reason) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      route: {
        include: {
          driver: { select: { firstName: true, lastName: true } }
        }
      },
      passenger: { select: { id: true, email: true, firstName: true, lastName: true } }
    },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.route.driverId !== userId) {
    throw new ApiError(403, 'Forbidden');
  }

  // Validate status transition
  const allowedStatuses = [BookingStatus.IN_TRANSIT, BookingStatus.COMPLETED, BookingStatus.CANCELLED];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, 'สถานะไม่ถูกต้อง');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateData = { status };
    if (status === BookingStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = 'DRIVER';
      updateData.cancelReason = reason || 'NO_SHOW';
    }

    const updated = await tx.booking.update({
      where: { id },
      data: updateData,
    });

    if (status === BookingStatus.CANCELLED) {
      // คืนที่นั่งให้ route
      const refunded = booking.numberOfSeats;
      const newSeats = booking.route.availableSeats + refunded;
      const routeUpdates = { availableSeats: newSeats };
      if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
        routeUpdates.status = RouteStatus.AVAILABLE;
      }
      await tx.route.update({
        where: { id: booking.route.id },
        data: routeUpdates,
      });
    }

    // Notify passenger
    let title = '';
    let body = '';
    if (status === BookingStatus.IN_TRANSIT) {
      title = 'เริ่มการเดินทางของคุณ';
      body = 'คนขับได้ยืนยันว่าคุณขึ้นรถแล้ว';
    } else if (status === BookingStatus.COMPLETED) {
      title = 'ถึงจุดหมายแล้ว';
      body = 'คนขับได้ยืนยันว่าคุณถึงจุดหมายเรียบร้อยแล้ว';
    } else if (status === BookingStatus.CANCELLED) {
      title = 'การจองถูกยกเลิก';
      body = `คนขับได้ยกเลิกการจองของคุณ เหตุผล: ${reason || 'ผู้โดยสารไม่มาตามนัด'}`;
    }

    await tx.notification.create({
      data: {
        userId: booking.passengerId,
        type: 'BOOKING',
        title,
        body,
        metadata: { kind: 'BOOKING_STATUS_UPDATE', bookingId: id, routeId: booking.route.id, status }
      }
    });

    return updated;
  });

  // --- ถ้า NO_SHOW: ส่ง socket kick + email ---
  if (status === BookingStatus.CANCELLED) {
    try {
      const io = getIO();
      // Kick passenger out of current-trip page
      io.to(`user:${booking.passengerId}`).emit('booking:passengerKicked', {
        bookingId: id,
        routeId: booking.routeId,
        reason: reason || 'NO_SHOW',
        message: `คนขับไม่พบคุณ ณ จุดนัดพบ การจองถูกยกเลิก`,
      });
    } catch (e) {
      console.error('[Socket] Failed to emit booking:passengerKicked:', e.message);
    }

    // Send no-show email asynchronously
    sendNoShowEmail(
      booking.passenger,
      booking.route.driver,
      booking
    ).catch(err => console.error('[Email] sendNoShowEmail failed:', err.message));
  }

  return result;
}

async function notifyWait(bookingId, passengerId, reason) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      route: true,
      passenger: { select: { firstName: true, lastName: true } }
    }
  });

  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.passengerId !== passengerId) throw new ApiError(403, 'Forbidden');
  if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.IN_TRANSIT) {
    throw new ApiError(400, 'สามารถแจ้งให้รอได้เฉพาะกรณีที่ยืนยันแล้วเท่านั้น');
  }

  const io = getIO();
  // Notify driver via socket
  io.to(`user:${booking.route.driverId}`).emit('booking:passengerRequestWait', {
    bookingId,
    routeId: booking.routeId,
    passengerId,
    passengerName: `${booking.passenger.firstName} ${booking.passenger.lastName}`,
    reason
  });

  // Create official notification for driver
  await prisma.notification.create({
    data: {
      userId: booking.route.driverId,
      type: 'BOOKING',
      title: 'ผู้โดยสารขอให้รอสักครู่',
      body: `คุณ ${booking.passenger.firstName} ขอให้คุณช่วยรอก่อน: ${reason || 'ไม่มีเหตุผลระบุ'}`,
      metadata: { kind: 'PASSENGER_WAIT_REQUEST', bookingId, routeId: booking.routeId, reason }
    }
  });

  return { success: true };
}
