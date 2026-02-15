const asyncHandler = require('express-async-handler');
const reportService = require('../services/report.service');
const ApiError = require('../utils/ApiError');

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
    const { type, title, description, targetUserId, targetObjectId, attachmentUrl } = req.body;
    
    const reportData = {
        reporterId: req.user.sub,
        type,
        title,
        description,
        targetUserId,
        targetObjectId,
        attachmentUrl
    };

    const newReport = await reportService.createReport(reportData);

    res.status(201).json({
        success: true,
        message: "Report created successfully",
        data: newReport
    });
});

module.exports = {
    adminListReports,
    getReportById,
    updateReportStatus,
    deleteReport,
    createReport
};
