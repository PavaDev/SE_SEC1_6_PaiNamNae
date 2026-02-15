const { z } = require('zod');

const createReportSchema = z.object({
    type: z.enum(['DRIVER', 'PASSENGER'], { message: 'Invalid report type' }),
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be at most 200 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be at most 2000 characters'),
    targetUserId: z.string().optional(),
    targetObjectId: z.string().optional(),
    attachmentUrl: z.string().url('Invalid attachment URL').optional(),
});

const updateReportStatusSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'], { message: 'Invalid status' }),
    adminNotes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
});

const listReportsQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    q: z.string().optional(),
    type: z.enum(['DRIVER', 'PASSENGER']).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

module.exports = {
    createReportSchema,
    updateReportStatusSchema,
    listReportsQuerySchema,
    idParamSchema,
};
