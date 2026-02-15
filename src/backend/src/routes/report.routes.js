const express = require('express');
const reportController = require('../controllers/report.controller');
const validate = require('../middlewares/validate');
const { protect, requireAdmin } = require('../middlewares/auth');
const { createReportSchema, updateReportStatusSchema, listReportsQuerySchema, idParamSchema } = require('../validations/report.validation');

const router = express.Router();

// --- Admin Routes ---
// GET /api/reports/admin
router.get(
    '/admin',
    protect,
    requireAdmin,
    validate({ query: listReportsQuerySchema }),
    reportController.adminListReports
);

// GET /api/reports/admin/:id
router.get(
    '/admin/:id',
    protect,
    requireAdmin,
    validate({ params: idParamSchema }),
    reportController.getReportById
);

// PATCH /api/reports/admin/:id
router.patch(
    '/admin/:id',
    protect,
    requireAdmin,
    validate({ params: idParamSchema, body: updateReportStatusSchema }),
    reportController.updateReportStatus
);

// DELETE /api/reports/admin/:id
router.delete(
    '/admin/:id',
    protect,
    requireAdmin,
    validate({ params: idParamSchema }),
    reportController.deleteReport
);

// --- User Routes ---
// POST /api/reports (Create a new report)
router.post(
    '/',
    protect,
    validate({ body: createReportSchema }),
    reportController.createReport
);

// GET /api/reports/:id (Get report details)
router.get(
    '/:id',
    protect,
    validate({ params: idParamSchema }),
    reportController.getReportById
);

module.exports = router;
