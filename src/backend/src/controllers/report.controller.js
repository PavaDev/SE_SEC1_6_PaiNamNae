const asyncHandler = require('express-async-handler');
const reportService = require('../services/report.service');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { getIO } = require('../socket');

const adminListReports = asyncHandler(async (req, res) => {
    const result = await reportService.searchReports(req.query);
    res.status(200).json({
        success: true,
        message: "Reports (admin) retrieved",
        ...result,
    });
});

const getReportById = asyncHandler(async (req, res) => {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
        throw new ApiError(404, "Report not found");
    }
    res.status(200).json({
        success: true,
        message: "Report retrieved",
        data: report
    });
});

const updateReportStatus = asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body;
    const updatedReport = await reportService.updateReportStatus(req.params.id, status, adminNotes, req.user.sub);

    // --- Socket.IO: notify reporter and target user about status change ---
    try {
        const io = getIO();
        const payload = {
            reportId: updatedReport.id,
            status: updatedReport.status,
            adminNotes: updatedReport.adminNotes,
            category: updatedReport.category,
            resolvedAt: updatedReport.resolvedAt,
        };

        // Notify the reporter
        if (updatedReport.reporterId) {
            const statusLabels = {
                'PENDING': 'รอพิจารณา',
                'APPROVED': 'อนุมัติ',
                'REJECTED': 'ปฏิเสธ',
                'RESOLVED': 'แก้ไขแล้ว'
            };
            const thaiStatus = statusLabels[status] || status;

            io.to(`user:${updatedReport.reporterId}`).emit('report:statusChanged', payload);
            io.to(`user:${updatedReport.reporterId}`).emit('notification:new', {
                id: Date.now(),
                type: 'SYSTEM',
                title: 'อัปเดตสถานะรายงาน',
                body: `รายงานของคุณถูกอัปเดตเป็น: ${thaiStatus}`,
                metadata: { kind: 'REPORT_STATUS_UPDATED', reportId: updatedReport.id, status: status },
                createdAt: new Date().toISOString(),
            });
        }

        // Notify the target user
        if (updatedReport.targetUserId && updatedReport.targetUserId !== updatedReport.reporterId) {
            io.to(`user:${updatedReport.targetUserId}`).emit('report:statusChanged', payload);
        }
    } catch (err) {
        console.error('Socket.IO emit error (report status):', err.message);
    }

    res.status(200).json({
        success: true,
        message: "Report status updated",
        data: updatedReport
    });
});

const deleteReport = asyncHandler(async (req, res) => {
    const deletedReport = await reportService.deleteReport(req.params.id);
    res.status(200).json({
        success: true,
        message: "Report deleted successfully",
        data: { deletedReportId: deletedReport.id }
    });
});

const createReport = asyncHandler(async (req, res) => {
    const { type, category, description, routeId, bookingId, targetUserId } = req.body;

    // Upload images to Cloudinary if present
    let imageUrls = [];
    if (req.files && req.files.images) {
        const uploads = req.files.images.map(file =>
            uploadToCloudinary(file.buffer, 'reports')
        );
        const results = await Promise.all(uploads);
        imageUrls = results.map(r => r.url);
    }

    const reportData = {
        reporterId: req.user.sub,
        type,
        category,
        description,
        images: imageUrls.length > 0 ? imageUrls : null,
        routeId: routeId || null,
        bookingId: bookingId || null,
        targetUserId: targetUserId || null,
    };

    const newReport = await reportService.createReport(reportData);

    // --- Socket.IO: notify target user and admins about new report ---
    try {
        const io = getIO();
        const reportPayload = {
            reportId: newReport.id,
            type: newReport.type,
            category: newReport.category,
            status: newReport.status,
            routeId: newReport.routeId,
            bookingId: newReport.bookingId,
            reporterId: newReport.reporterId,
            targetUserId: newReport.targetUserId,
            createdAt: newReport.createdAt,
        };

        // Notify target user
        if (newReport.targetUserId) {
            io.to(`user:${newReport.targetUserId}`).emit('report:created', reportPayload);
            io.to(`user:${newReport.targetUserId}`).emit('notification:new', {
                id: Date.now(),
                type: 'SYSTEM',
                title: 'มีรายงานใหม่เกี่ยวกับคุณ',
                body: `หมวดหมู่: ${category}`,
                metadata: { kind: 'NEW_REPORT_TARGET', reportId: newReport.id, category: category },
                createdAt: new Date().toISOString(),
            });
        }

        // Notify admins
        io.to('admins').emit('report:created', reportPayload);
        io.to('admins').emit('notification:new', {
            type: 'report',
            title: 'มีรายงานใหม่',
            body: `ประเภท: ${type} | หมวดหมู่: ${category}`,
            reportId: newReport.id,
            createdAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Socket.IO emit error (report create):', err.message);
    }

    res.status(201).json({
        success: true,
        message: "Report created successfully",
        data: newReport
    });
});

const getMyReports = asyncHandler(async (req, res) => {
    const reports = await reportService.getReportsByUser(req.user.sub);
    res.status(200).json({
        success: true,
        message: "My reports retrieved",
        data: reports
    });
});

const getReportForBooking = asyncHandler(async (req, res) => {
    const report = await reportService.getReportByBookingId(req.params.bookingId, req.user.sub);
    res.status(200).json({
        success: true,
        hasReport: !!report,
        data: report
    });
});

module.exports = {
    adminListReports,
    getReportById,
    updateReportStatus,
    deleteReport,
    createReport,
    getMyReports,
    getReportForBooking,
};
