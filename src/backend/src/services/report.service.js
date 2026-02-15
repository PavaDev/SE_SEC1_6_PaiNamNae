const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

// Mock data for reports
const mockReports = [
    {
        id: '1',
        reporterId: 'user-1',
        reporterName: 'สมชาย ใจดี',
        reporterEmail: 'somchai@example.com',
        reporterAvatar: 'https://ui-avatars.com/api/?name=somchai&background=random&size=64',
        type: 'DRIVER',
        status: 'PENDING',
        title: 'พฤติกรรมไม่สุภาพของผู้ขับ',
        description: 'ผู้ขับใช้ถ้อยคำหยาบคายต่อผู้โดยสาร',
        targetUserId: 'driver-2',
        targetObjectId: 'route-1',
        attachmentUrl: null,
        adminNotes: null,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: new Date('2024-02-13'),
        updatedAt: new Date('2024-02-13'),
    },
    {
        id: '2',
        reporterId: 'user-2',
        reporterName: 'ชนิดา ขยัน',
        reporterEmail: 'chanida@example.com',
        reporterAvatar: 'https://ui-avatars.com/api/?name=chanida&background=random&size=64',
        type: 'PASSENGER',
        status: 'APPROVED',
        title: 'พฤติกรรมไม่สุภาพของผู้ใช้',
        description: 'ผู้ใช้ส่งข้อความที่ไม่เหมาะสมหรือหยาบคาย',
        targetUserId: 'user-4',
        targetObjectId: null,
        attachmentUrl: null,
        adminNotes: 'ดำเนินการเรียกเก็บค่าปรับจากคนขับ',
        resolvedAt: new Date('2024-02-14'),
        resolvedBy: 'admin-1',
        createdAt: new Date('2024-02-12'),
        updatedAt: new Date('2024-02-14'),
    },
    {
        id: '3',
        reporterId: 'user-3',
        reporterName: 'วิทยา สมุด',
        reporterEmail: 'witthaya@example.com',
        reporterAvatar: 'https://ui-avatars.com/api/?name=witthaya&background=random&size=64',
        type: 'DRIVER',
        status: 'REJECTED',
        title: 'ประมาณค่าโดยสารสูงเกินไป',
        description: 'ผู้ขับคิดค่าโดยสารสูงกว่าที่ตกลงไว้',
        targetUserId: 'user-4',
        targetObjectId: null,
        attachmentUrl: null,
        adminNotes: 'ตรวจสอบแล้วไม่พบหลักฐานชัดเจน',
        resolvedAt: new Date('2024-02-11'),
        resolvedBy: 'admin-2',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-11'),
    }
];

const searchReports = async (opts = {}) => {
    const {
        page = 1,
        limit = 20,
        q,
        type,
        status,
        dateFrom,
        dateTo,
    } = opts;

    // Filter mock data
    let filtered = [...mockReports];

    if (type) {
        filtered = filtered.filter(r => r.type === type);
    }

    if (status) {
        filtered = filtered.filter(r => r.status === status);
    }

    if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter(r => new Date(r.createdAt) >= from);
    }

    if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(r => new Date(r.createdAt) <= to);
    }

    if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(r => 
            r.id.toLowerCase().includes(query) ||
            r.title.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query) ||
            r.reporterName.toLowerCase().includes(query) ||
            r.reporterEmail.toLowerCase().includes(query)
        );
    }

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const data = filtered.slice(skip, skip + limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    };
};

const getReportById = async (id) => {
    return mockReports.find(r => r.id === id) || null;
};

const createReport = async (reportData) => {
    const newReport = {
        id: `${Date.now()}`,
        ...reportData,
        status: 'PENDING',
        adminNotes: null,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    mockReports.push(newReport);
    return newReport;
};

const updateReportStatus = async (id, status, adminNotes, adminId) => {
    const report = mockReports.find(r => r.id === id);
    if (!report) {
        throw new ApiError(404, 'Report not found');
    }

    report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    if (status === 'RESOLVED') {
        report.resolvedAt = new Date();
        report.resolvedBy = adminId;
    }
    report.updatedAt = new Date();

    return report;
};

const deleteReport = async (id) => {
    const index = mockReports.findIndex(r => r.id === id);
    if (index === -1) {
        throw new ApiError(404, 'Report not found');
    }
    const [deleted] = mockReports.splice(index, 1);
    return deleted;
};

module.exports = {
    searchReports,
    getReportById,
    createReport,
    updateReportStatus,
    deleteReport
};
