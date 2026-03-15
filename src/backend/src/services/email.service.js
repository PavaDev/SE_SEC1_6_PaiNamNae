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
 * @param {boolean} isUpdate - เป็นการแจ้งเตือนซ้ำ/อัพเดทเวลา (default: false)
 * @param {string} reason    - เหตุผลประกอบ (ถ้ามี)
 */
async function sendArrivalNotificationEmail(passenger, driver, booking, minutes, isUpdate = false, reason = null) {
  if (process.env.ENABLE_EMAIL_NOTIFICATION !== 'true') {
    console.log('[Email] Email sending is disabled via ENABLE_EMAIL_NOTIFICATION toggle.');
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP credentials not configured, skipping email.');
    return;
  }

  const pickupName = booking.pickupLocation?.name || 'จุดนัดพบของคุณ';
  const dropoffName = booking.dropoffLocation?.name || 'จุดหมาย';

  const headerColor = isUpdate ? '#f59e0b' : '#2563eb';
  const headerTitle = isUpdate ? '🔄 อัพเดทเวลาถึง!' : '🚗 คนขับกำลังมาถึง!';
  const bgSubTheme = isUpdate ? '#fffbeb' : '#eff6ff';
  const borderSubTheme = isUpdate ? '#fef3c7' : '#bfdbfe';
  const textSubTheme = isUpdate ? '#92400e' : '#1e40af';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
      <div style="background: ${headerColor}; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 26px;">${headerTitle}</h1>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; margin-bottom: 24px;">สวัสดีคุณ <strong>${passenger.firstName} ${passenger.lastName}</strong>,</p>
        
        <div style="background: ${bgSubTheme}; border: 1px solid ${borderSubTheme}; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            ${isUpdate ? 'เวลาใหม่ที่คาดว่าจะถึง' : 'เวลาที่คาดว่าจะถึง'}
          </p>
          <p style="margin: 0; color: ${textSubTheme}; font-size: 32px; font-weight: 800;">
            ${minutes === 0 ? 'ถึงจุดรับแล้ว!' : minutes + ' นาที'}
          </p>
          <p style="margin: 12px 0 0 0; color: #475569; font-size: 15px; font-weight: 500;">
            คุณ${driver.firstName} ${driver.lastName} กำลังมุ่งหน้าไปหาคุณ
          </p>
        </div>

        ${reason ? `
        <div style="background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">เหตุผลจากคนขับ:</p>
          <p style="margin: 0; color: #334155; font-size: 14px; font-style: italic;">"${reason}"</p>
        </div>
        ` : ''}

        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em;">รายละเอียดจุดรับ-ส่ง</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 100px;">📍 จุดรับ:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${pickupName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">🏁 จุดส่ง:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${dropoffName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">💺 ที่นั่ง:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${booking.numberOfSeats} ที่นั่ง</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px;">
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 16px;">
            กรุณาเตรียมตัวให้พร้อม ณ จุดนัดพบของคุณ<br/>
            หากมีการเปลี่ยนแปลง คุณสามารถติดต่อคนขับผ่านแชทในแอปพลิเคชัน
          </p>
          <div style="display: inline-block; background: #f1f5f9; color: #475569; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em;">
            ไปนำแหน่ — RIDE TOGETHER
          </div>
        </div>
      </div>
    </div>
  `;

  const subjectPrefix = isUpdate ? `🔄 [อัพเดท] ` : `🚗 `;
  const subjectTitle = minutes === 0 ? `คนขับถึงจุดนัดพบเเล้ว!` : `คนขับแจ้งว่าจะถึงใน ${minutes} นาที`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"ไปนำแหน่" <${process.env.SMTP_USER}>`,
    to: passenger.email,
    subject: `${subjectPrefix}${subjectTitle} — ไปนำแหน่`,
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
  if (process.env.ENABLE_EMAIL_NOTIFICATION !== 'true') {
    console.log('[Email] Email sending is disabled via ENABLE_EMAIL_NOTIFICATION toggle.');
    return;
  }

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
