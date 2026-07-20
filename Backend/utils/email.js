import nodemailer from 'nodemailer';

const FROM = `"PhysioCare" <${process.env.EMAIL_USER}>`;

// Lazy initialization — transporter is only created when first email is sent
let _transporter = null;
const getTransporter = () => {
    if (_transporter) return _transporter;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[Email] EMAIL_USER or EMAIL_PASS not set — emails will be skipped');
        return null;
    }
    _transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,   // your Gmail address
            pass: process.env.EMAIL_PASS    // Gmail App Password (NOT your Gmail login password)
        }
    });
    return _transporter;
};

// Internal helper — all email functions use this
const sendEmail = ({ to, subject, html }) => {
    const transporter = getTransporter();
    if (!transporter) return;
    transporter.sendMail({ from: FROM, to, subject, html })
        .catch(err => console.error('[Email] Failed to send to', to, ':', err.message));
};

// ─── Send Welcome Email (New Patient Created by Receptionist) ─────────────────
export const sendWelcomeEmail = ({ to, first_name, email, tempPassword }) => {
    sendEmail({
        to,
        subject: 'Your PhysioCare Account is Ready',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to PhysioCare!</h2>
                <p>Hello ${first_name},</p>
                <p>Your account has been created by our team. Here are your login details:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
                </div>
                <p>Please log in and change your password from your profile settings.</p>
                <p>You can access your appointment history, exercise plans, and health records from your dashboard.</p>
                <br/>
                <p>The PhysioCare Team</p>
            </div>
        `
    });
};

// ─── Send Appointment Confirmation Email ──────────────────────────────────────
export const sendAppointmentConfirmationEmail = ({ to, first_name, doctor_name, appointment_date, start_time }) => {
    sendEmail({
        to,
        subject: 'Your Appointment is Confirmed — PhysioCare',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Appointment Confirmed ✅</h2>
                <p>Hello ${first_name},</p>
                <p>Your appointment has been confirmed. Here are the details:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Doctor:</strong> ${doctor_name}</p>
                    <p><strong>Date:</strong> ${appointment_date}</p>
                    <p><strong>Time:</strong> ${start_time}</p>
                </div>
                <p>Please arrive 10 minutes early. If you need to cancel or reschedule, please contact the clinic.</p>
                <br/>
                <p>The PhysioCare Team</p>
            </div>
        `
    });
};

// ─── Send Payment Link Email (Phone Booking) ──────────────────────────────────
export const sendPaymentLinkEmail = ({ to, first_name, payment_link, expires_in_minutes }) => {
    sendEmail({
        to,
        subject: 'Complete Your PhysioCare Booking Payment',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Complete Your Payment</h2>
                <p>Hello ${first_name},</p>
                <p>Your appointment slot has been reserved. Please complete payment within <strong>${expires_in_minutes} minutes</strong> to confirm your booking.</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${payment_link}" 
                       style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Pay Now
                    </a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy this link: ${payment_link}</p>
                <p style="color: #ef4444; font-size: 14px;">⚠️ This link expires in ${expires_in_minutes} minutes. Unpaid slots will be released automatically.</p>
                <br/>
                <p>The PhysioCare Team</p>
            </div>
        `
    });
};

// ─── Send Invoice Receipt Email ────────────────────────────────────────────────
export const sendInvoiceEmail = ({ to, first_name, invoice_number, amount, description, issued_date }) => {
    sendEmail({
        to,
        subject: `Your PhysioCare Receipt — ${invoice_number}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background: #6d28d9; padding: 24px;">
                    <h2 style="color: white; margin: 0;">PhysioCare</h2>
                    <p style="color: #ddd6fe; margin: 4px 0 0;">Payment Receipt</p>
                </div>
                <div style="padding: 24px;">
                    <p>Hello ${first_name},</p>
                    <p>Thank you for your payment. Here is your receipt for reference:</p>
                    <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Invoice No.</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${invoice_number}</td></tr>
                            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Date</td><td style="padding: 6px 0; text-align: right;">${issued_date}</td></tr>
                            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Description</td><td style="padding: 6px 0; text-align: right;">${description}</td></tr>
                            <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 10px 0; font-weight: bold;">Amount Paid</td><td style="padding: 10px 0; font-weight: bold; font-size: 18px; text-align: right; color: #16a34a;">₹${amount}</td></tr>
                        </table>
                    </div>
                    <p style="color: #6b7280; font-size: 13px;">Please keep this email for your records. For any queries, contact the PhysioCare clinic.</p>
                    <p>The PhysioCare Team</p>
                </div>
            </div>
        `
    });
};

