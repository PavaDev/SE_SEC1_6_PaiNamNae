const asyncHandler = require('express-async-handler');
const reportService = require('../services/report.service');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary } = require('../utils/cloudinary');

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
