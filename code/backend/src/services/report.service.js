const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const reportInclude = {
    reporter: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            ratingAverage: true,
            ratingCount: true,
        },
    },
    targetUser: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            ratingAverage: true,
            ratingCount: true,
        },
    },
    route: {
        include: {
            driver: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profilePicture: true,
                },
            },
            vehicle: {
                select: {
                    id: true,
                    vehicleModel: true,
                    licensePlate: true,
                    color: true,
                },
            },
        },
    },
    booking: {
        select: {
            id: true,
            status: true,
            numberOfSeats: true,
        },
    },
    resolvedBy: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
        },
    },
};

const searchReports = async (opts = {}) => {
    const {
        page = 1,
        limit = 20,
        q,
        type,
        status,
        reporterId,
        reporterSearch,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = opts;

    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;

    if (reporterSearch) {
        where.reporter = {
            OR: [
                { firstName: { contains: reporterSearch, mode: 'insensitive' } },
                { lastName: { contains: reporterSearch, mode: 'insensitive' } },
                { email: { contains: reporterSearch, mode: 'insensitive' } },
                { username: { contains: reporterSearch, mode: 'insensitive' } },
                { id: { contains: reporterSearch, mode: 'insensitive' } },
            ],
        };
    }

    if (opts.targetUserSearch) {
        const ts = opts.targetUserSearch;
        where.targetUser = {
            OR: [
                { firstName: { contains: ts, mode: 'insensitive' } },
                { lastName: { contains: ts, mode: 'insensitive' } },
                { email: { contains: ts, mode: 'insensitive' } },
                { username: { contains: ts, mode: 'insensitive' } },
                { id: { contains: ts, mode: 'insensitive' } },
            ],
        };
    }

    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            where.createdAt.lte = to;
        }
    }

    if (q) {
        where.OR = [
            { id: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { reporter: { firstName: { contains: q, mode: 'insensitive' } } },
            { reporter: { lastName: { contains: q, mode: 'insensitive' } } },
            { reporter: { email: { contains: q, mode: 'insensitive' } } },
            { reporter: { username: { contains: q, mode: 'insensitive' } } },
        ];
    }

    const [data, total] = await Promise.all([
        prisma.report.findMany({
            where,
            include: reportInclude,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.report.count({ where }),
    ]);

    // flatten reporter info for admin convenience
    const formatted = data.map(r => ({
        ...r,
        reporterName: `${r.reporter?.firstName || ''} ${r.reporter?.lastName || ''}`.trim(),
        reporterEmail: r.reporter?.email || '',
        reporterAvatar: r.reporter?.profilePicture || null,
    }));

    return {
        data: formatted,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getReportById = async (id) => {
    return prisma.report.findUnique({
        where: { id },
        include: reportInclude,
    });
};

const createReport = async (reportData) => {
    const report = await prisma.report.create({
        data: {
            reporterId: reportData.reporterId,
            type: reportData.type,
            category: reportData.category,
            description: reportData.description,
            images: reportData.images || null,
            routeId: reportData.routeId || null,
            bookingId: reportData.bookingId || null,
            targetUserId: reportData.targetUserId || null,
        },
        include: reportInclude,
    });

    // 🔔 แจ้งเตือนเป้าหมาย (Target User)
    if (reportData.targetUserId) {
        await prisma.notification.create({
            data: {
                userId: reportData.targetUserId,
                type: 'SYSTEM',
                title: 'มีรายงานใหม่เกี่ยวกับคุณ',
                body: `หมวดหมู่: ${reportData.category}`,
                metadata: { kind: 'NEW_REPORT_TARGET', reportId: report.id, category: reportData.category }
            }
        });
    }

    return report;
};

const updateReportStatus = async (id, status, adminNotes, adminId) => {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
        throw new ApiError(404, 'Report not found');
    }

    const updateData = {
        status,
        adminNotes: adminNotes || report.adminNotes,
    };

    if (status === 'RESOLVED' || status === 'APPROVED' || status === 'REJECTED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = adminId;
    }

    const updated = await prisma.report.update({
        where: { id },
        data: updateData,
        include: reportInclude,
    });

    // 🔔 แจ้งเตือนผู้รายงาน (Reporter) เมื่อสถานะอัปเดต
    const statusLabels = {
        'PENDING': 'รอพิจารณา',
        'APPROVED': 'อนุมัติ',
        'REJECTED': 'ปฏิเสธ',
        'RESOLVED': 'แก้ไขแล้ว'
    };
    const thaiStatus = statusLabels[status] || status;

    await prisma.notification.create({
        data: {
            userId: updated.reporterId,
            type: 'SYSTEM',
            title: 'อัปเดตสถานะรายงาน',
            body: `รายงานของคุณถูกอัปเดตเป็น: ${thaiStatus}`,
            metadata: { kind: 'REPORT_STATUS_UPDATED', reportId: id, status: status }
        }
    });

    return updated;
};

const deleteReport = async (id) => {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
        throw new ApiError(404, 'Report not found');
    }
    return prisma.report.delete({ where: { id } });
};

const getReportsByUser = async (userId) => {
    return prisma.report.findMany({
        where: { reporterId: userId },
        include: reportInclude,
        orderBy: { createdAt: 'desc' },
    });
};

const getReportByBookingId = async (bookingId, reporterId) => {
    const where = { bookingId };
    if (reporterId) where.reporterId = reporterId;

    return prisma.report.findFirst({
        where,
        include: reportInclude,
        orderBy: { createdAt: 'desc' },
    });
};

module.exports = {
    searchReports,
    getReportById,
    createReport,
    updateReportStatus,
    deleteReport,
    getReportsByUser,
    getReportByBookingId,
};
