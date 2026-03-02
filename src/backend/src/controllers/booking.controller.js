const asyncHandler = require("express-async-handler");
const bookingService = require("../services/booking.service");
const ApiError = require("../utils/ApiError");
const { getIO } = require("../socket");

const adminListBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.searchBookingsAdmin(req.query);
  res.status(200).json({ success: true, message: 'Bookings (admin) retrieved', ...result });
});

const adminCreateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.adminCreateBooking(req.body);
  res.status(201).json({ success: true, data: booking });
});

const adminUpdateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await bookingService.adminUpdateBooking(id, req.body);
  res.status(200).json({ success: true, data: updated });
});

const createBooking = asyncHandler(async (req, res) => {
  const passengerId = req.user.sub;
  const payload = {
    routeId: req.body.routeId,
    numberOfSeats: req.body.numberOfSeats,
    pickupLocation: req.body.pickupLocation,
    dropoffLocation: req.body.dropoffLocation,
  };

  const booking = await bookingService.createBooking(payload, passengerId);

  // --- Socket.IO: notify driver + update trip list ---
  try {
    const io = getIO();
    const fullBooking = await bookingService.getBookingById(booking.id);
    // Notify driver of new booking
    io.to(`user:${fullBooking.route.driverId}`).emit('booking:created', fullBooking);
    // Update trip list for all passengers on /findTrip
    io.to('trips').emit('trip:updated', {
      routeId: fullBooking.routeId,
      availableSeats: fullBooking.route.availableSeats,
      status: fullBooking.route.status,
    });
    // Real-time notification for driver
    io.to(`user:${fullBooking.route.driverId}`).emit('notification:new', {
      type: 'BOOKING',
      title: 'มีการจองใหม่ในเส้นทางของคุณ',
      body: 'ผู้โดยสารได้ทำการจองที่นั่งในเส้นทางของคุณแล้ว',
    });
  } catch (e) { console.error('Socket emit error (createBooking):', e.message); }

  res.status(201).json({ success: true, data: booking });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const passengerId = req.user.sub;
  const list = await bookingService.getMyBookings(passengerId);
  res.status(200).json({ success: true, data: list });
});

const adminGetBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const booking = await bookingService.getBookingById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  res.status(200).json({ success: true, data: booking });
})

const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingService.getBookingById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  const userId = req.user.sub;
  if (
    booking.passengerId !== userId &&
    booking.route.driverId !== userId
  ) {
    throw new ApiError(403, 'Forbidden');
  }

  res.status(200).json({ success: true, data: booking });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const driverId = req.user.sub;
  const { id } = req.params;
  const { status } = req.body;

  const updated = await bookingService.updateBookingStatus(
    id,
    status,
    driverId
  );

  // --- Socket.IO: notify passenger + update trip list ---
  try {
    const io = getIO();
    const fullBooking = await bookingService.getBookingById(id);
    // Notify passenger of status change
    io.to(`user:${fullBooking.passengerId}`).emit('booking:statusChanged', {
      bookingId: id,
      status,
      routeId: fullBooking.routeId,
    });
    // Update trip list (seats may have changed on REJECTED)
    io.to('trips').emit('trip:updated', {
      routeId: fullBooking.routeId,
      availableSeats: fullBooking.route.availableSeats,
      status: fullBooking.route.status,
    });
    // Real-time notification for passenger
    const notifTitle = status === 'CONFIRMED' ? 'คำขอจองได้รับการยืนยัน' : 'คำขอจองถูกปฏิเสธ';
    const notifBody = status === 'CONFIRMED'
      ? 'คนขับได้ยืนยันการจองของคุณแล้ว'
      : 'ขออภัย คนขับได้ปฏิเสธคำขอจองของคุณ';
    io.to(`user:${fullBooking.passengerId}`).emit('notification:new', {
      id: Date.now(),
      type: 'BOOKING',
      title: notifTitle,
      body: notifBody,
      metadata: { kind: status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 'BOOKING_REJECTED', bookingId: id },
      createdAt: new Date().toISOString()
    });
  } catch (e) { console.error('Socket emit error (updateBookingStatus):', e.message); }

  res.status(200).json({ success: true, data: updated });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const passengerId = req.user.sub;
  const { id } = req.params;
  const { reason } = req.body;

  // Fetch booking before cancel to get driver info
  const bookingBefore = await bookingService.getBookingById(id);
  const cancelled = await bookingService.cancelBooking(id, passengerId, { reason });

  // --- Socket.IO: notify driver + update trip list ---
  try {
    const io = getIO();
    const routeAfter = await bookingService.getBookingById(id);
    // Notify driver of cancellation
    io.to(`user:${bookingBefore.route.driverId}`).emit('booking:cancelled', {
      bookingId: id,
      routeId: bookingBefore.routeId,
      passengerId,
    });
    // Update trip list
    if (routeAfter && routeAfter.route) {
      io.to('trips').emit('trip:updated', {
        routeId: bookingBefore.routeId,
        availableSeats: routeAfter.route.availableSeats,
        status: routeAfter.route.status,
      });
    }
    // Real-time notification for driver
    try {
      const io = getIO();
      io.to(`user:${bookingBefore.route.driverId}`).emit('notification:new', {
        type: 'BOOKING',
        title: 'ผู้โดยสารยกเลิกการจอง',
        body: 'ผู้โดยสารได้ยกเลิกการจองในเส้นทางของคุณ',
        metadata: { kind: 'BOOKING_CANCELLED', bookingId: id, routeId: bookingBefore.routeId, cancelledBy: 'PASSENGER' },
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Socket.IO emit error:', err.message);
    }
  } catch (e) { console.error('Socket emit error (cancelBooking):', e.message); }

  res.status(200).json({ success: true, data: cancelled });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const deleted = await bookingService.deleteBooking(id, userId);
  res.status(200).json({ success: true, data: deleted });
});

const adminDeleteBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await bookingService.adminDeleteBooking(id);
  res.status(200).json({ success: true, data: result });
});

const updatePassengerStatus = asyncHandler(async (req, res) => {
  const driverId = req.user.sub;
  const { id } = req.params;
  const { status, reason } = req.body;

  const updated = await bookingService.updatePassengerStatus(id, status, driverId, reason);

  // --- Socket.IO: notify passenger ---
  try {
    const io = getIO();
    io.to(`user:${updated.passengerId}`).emit('booking:passengerStatusChanged', {
      bookingId: id,
      status,
      routeId: updated.routeId,
    });
  } catch (e) { console.error('Socket emit error (updatePassengerStatus):', e.message); }

  res.status(200).json({ success: true, data: updated });
});

const notifyArrival = asyncHandler(async (req, res) => {
  const driverId = req.user.sub;
  const { id } = req.params;
  const { minutes } = req.body;

  const result = await bookingService.notifyArrival(id, minutes, driverId);

  res.status(200).json({ success: true, message: 'แจ้งเตือนผู้โดยสารเรียบร้อยแล้ว', data: result });
});

module.exports = {
  adminListBookings,
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  adminGetBookingById,
  adminCreateBooking,
  adminUpdateBooking,
  adminDeleteBooking,
  updatePassengerStatus,
  notifyArrival,
};
