const multer = require('multer');
const ApiError = require('../utils/ApiError');

// กำหนดค่า Multer ให้เก็บไฟล์ใน memoryชั่วคราวเพื่อรอส่งต่อไปยัง Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // จำกัดขนาดไฟล์ไม่เกิน 100 MB เพื่อรองรับวิดีโอ
    fileFilter: (req, file, cb) => {
        // อนุญาตไฟล์รูปภาพ, วิดีโอ และเสียง
        if (
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/') ||
            file.mimetype.startsWith('audio/')
        ) {
            cb(null, true);
        } else {
            cb(new ApiError(400, 'รองรับเฉพาะไฟล์รูปภาพ วิดีโอ และเสียงเท่านั้น!'), false);
        }
    },
});

module.exports = upload;
