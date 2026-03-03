const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * ส่งอีเมลแจ้งเตือนผู้โดยสารว่าคนขับกำลังจะมาถึง
 * @param {Object} passenger - { email, firstName, lastName }
 * @param {Object} driver    - { firstName, lastName }
 * @param {Object} booking   - { id, routeId, pickupLocation, dropoffLocation, numberOfSeats }
 * @param {number} minutes   - จำนวนนาทีที่คาดว่าจะถึง
 */
async function sendArrivalNotificationEmail(passenger, driver, booking, minutes) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[Email] SMTP credentials not configured, skipping email.');
        return;
    }

    const pickupName = booking.pickupLocation?.name || 'จุดนัดพบของคุณ';
    const dropoffName = booking.dropoffLocation?.name || 'จุดหมาย';

    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🚗 คนขับกำลังมาถึง!</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
        <p style="color: #374151; font-size: 16px;">สวัสดีคุณ <strong>${passenger.firstName} ${passenger.lastName}</strong></p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 16px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 18px; font-weight: bold; text-align: center;">
            ⏱️ คุณ${driver.firstName} ${driver.lastName} จะมาถึงใน <span style="font-size: 24px;">${minutes} นาที</span>
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📍 จุดรับ:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${pickupName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🏁 จุดส่ง:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${dropoffName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">💺 จำนวนที่นั่ง:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${booking.numberOfSeats} ที่นั่ง</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 24px;">
          กรุณาเตรียมตัวให้พร้อม ณ จุดนัดพบของคุณ<br/>
          หากมีปัญหา กรุณาติดต่อผ่านแอปพลิเคชัน
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <span style="background: #dbeafe; color: #1d4ed8; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;">ไปนำแหน่ — Ride Together</span>
        </div>
      </div>
    </div>
  `;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ไปนำแหน่" <${process.env.SMTP_USER}>`,
        to: passenger.email,
        subject: `🚗 คนขับกำลังมาถึงใน ${minutes} นาที — ไปนำแหน่`,
        html,
    });

    console.log(`[Email] Arrival notification sent to ${passenger.email}`);
}

/**
 * ส่งอีเมลแจ้งผู้โดยสารว่าคนขับหาไม่พบและยกเลิกการจอง
 * @param {Object} passenger - { email, firstName, lastName }
 * @param {Object} driver    - { firstName, lastName }
 * @param {Object} booking   - { id, routeId, pickupLocation, dropoffLocation, numberOfSeats }
 */
async function sendNoShowEmail(passenger, driver, booking) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[Email] SMTP credentials not configured, skipping email.');
        return;
    }

    const pickupName = booking.pickupLocation?.name || 'จุดนัดพบ';
    const dropoffName = booking.dropoffLocation?.name || 'จุดหมาย';

    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ การจองถูกยกเลิก</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
        <p style="color: #374151; font-size: 16px;">สวัสดีคุณ <strong>${passenger.firstName} ${passenger.lastName}</strong></p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 16px 0;">
          <p style="margin: 0; color: #991b1b; font-size: 15px; font-weight: 600; text-align: center;">
            คปขับ<strong>${driver.firstName} ${driver.lastName}</strong><br/>
            ไม่พบคุณ ณ จุดนัดพบ และได้ยกเลิกการจองแล้ว
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📍 จุดรับ:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${pickupName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🏁 จุดส่ง:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${dropoffName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">💺 จำนวนที่นั่ง:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${booking.numberOfSeats} ที่นั่ง</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 24px;">
          หากคิดว่าเกิดข้อผิดพลาด กรุณาติดต่อทีมสนับสนุนของไปนำแหน่<br/>
          หรือจองการเดินทางใหม่ได้ทันทีในแอปพลิเคชัน
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;">ไปนำแหน่ — Ride Together</span>
        </div>
      </div>
    </div>
  `;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ไปนำแหน่" <${process.env.SMTP_USER}>`,
        to: passenger.email,
        subject: `⚠️ การจองของคุณถูกยกเลิก — ไม่พบผู้โดยสาร`,
        html,
    });

    console.log(`[Email] No-show notification sent to ${passenger.email}`);
}

module.exports = {
    sendArrivalNotificationEmail,
    sendNoShowEmail,
};
