// =============================================================================
// VRINDAVAN BHANDARA — Email Notification Service
// Source: 02-system-architecture.md — Resend for transactional email
// =============================================================================

import { Resend } from "resend";
import type { BookingWithDetails } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";

// Lazy singleton — initialized on first use at runtime, not at build time
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = () =>
  `${process.env.RESEND_FROM_NAME ?? "Vrindavan Bhandara"} <${process.env.RESEND_FROM_EMAIL ?? "seva@vrindavanbhandara.com"}>`;

// =============================================================================
// Email: Booking Confirmation
// =============================================================================

export async function sendBookingConfirmationEmail(
  booking: BookingWithDetails
): Promise<void> {
  const { user, package: pkg, bookingNumber, sevaDate, totalAmount } = booking;

  await getResend().emails.send({
    from: FROM(),
    to: user.email,
    subject: `🙏 Booking Confirmed — ${pkg.serviceCategory.name} | ${bookingNumber}`,
    html: buildBookingConfirmationHtml({
      name: user.name,
      bookingNumber,
      serviceName: pkg.serviceCategory.name,
      packageName: pkg.name,
      sevaDate: formatDate(sevaDate),
      amount: formatCurrency(totalAmount),
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/bookings/${booking.id}`,
    }),
  });
}

// =============================================================================
// Email: Payment Received
// =============================================================================

export async function sendPaymentReceivedEmail(
  booking: BookingWithDetails
): Promise<void> {
  const { user, bookingNumber, totalAmount } = booking;

  await getResend().emails.send({
    from: FROM(),
    to: user.email,
    subject: `✅ Payment Received — ₹${formatCurrency(totalAmount)} | ${bookingNumber}`,
    html: buildPaymentReceivedHtml({
      name: user.name,
      bookingNumber,
      amount: formatCurrency(totalAmount),
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/bookings/${booking.id}`,
    }),
  });
}

// =============================================================================
// Email: Seva Completed
// =============================================================================

export async function sendSevaCompletedEmail(
  booking: BookingWithDetails
): Promise<void> {
  const { user, bookingNumber, package: pkg } = booking;

  await getResend().emails.send({
    from: FROM(),
    to: user.email,
    subject: `🌸 Seva Completed — ${pkg.serviceCategory.name} | ${bookingNumber}`,
    html: buildSevaCompletedHtml({
      name: user.name,
      bookingNumber,
      serviceName: pkg.serviceCategory.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/bookings/${booking.id}`,
    }),
  });
}

// =============================================================================
// HTML Templates (inline styled for email client compatibility)
// =============================================================================

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vrindavan Bhandara</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFF0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFF0;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#D4AF37,#FF7722);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;font-family:Georgia,serif;letter-spacing:1px;">🪔 Vrindavan Bhandara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Spiritual Seva. Transparent Proof.</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f0;padding:24px 32px;text-align:center;border-top:1px solid #e8e0c0;">
              <p style="color:#888;font-size:12px;margin:0;">Vrindavan Bhandara | vrindavanbhandara.com</p>
              <p style="color:#888;font-size:12px;margin:4px 0 0;">Serving devotees worldwide with transparent seva</p>
              <p style="color:#888;font-size:11px;margin:12px 0 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/privacy-policy" style="color:#D4AF37;text-decoration:none;">Privacy Policy</a> · 
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color:#D4AF37;text-decoration:none;">Contact</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildBookingConfirmationHtml(params: {
  name: string;
  bookingNumber: string;
  serviceName: string;
  packageName: string;
  sevaDate: string;
  amount: string;
  dashboardUrl: string;
}): string {
  return emailWrapper(`
    <h2 style="color:#1A1A2E;font-family:Georgia,serif;margin:0 0 8px;">🙏 Jai Shri Krishna, ${params.name}!</h2>
    <p style="color:#555;margin:0 0 24px;line-height:1.6;">Your booking has been confirmed. Our team will ensure your seva is performed with full devotion.</p>
    
    <div style="background:#FFF8DC;border:1px solid #D4AF37;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Booking Number</td><td style="padding:6px 0;color:#1A1A2E;font-weight:700;text-align:right;">${params.bookingNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Service</td><td style="padding:6px 0;color:#1A1A2E;text-align:right;">${params.serviceName}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Package</td><td style="padding:6px 0;color:#1A1A2E;text-align:right;">${params.packageName}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:13px;">Seva Date</td><td style="padding:6px 0;color:#1A1A2E;text-align:right;">${params.sevaDate}</td></tr>
        <tr><td style="padding:6px 0;border-top:1px solid #D4AF37;color:#888;font-size:13px;padding-top:12px;">Amount Paid</td><td style="padding:6px 0;border-top:1px solid #D4AF37;color:#D4AF37;font-weight:700;font-size:18px;text-align:right;padding-top:12px;">${params.amount}</td></tr>
      </table>
    </div>
    
    <a href="${params.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#FF7722);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">Track Your Seva →</a>
    
    <p style="color:#888;font-size:13px;margin:24px 0 0;line-height:1.6;">You will receive updates via email as your seva progresses. Photos and videos will be shared upon completion.</p>
  `);
}

function buildPaymentReceivedHtml(params: {
  name: string;
  bookingNumber: string;
  amount: string;
  dashboardUrl: string;
}): string {
  return emailWrapper(`
    <h2 style="color:#1A1A2E;font-family:Georgia,serif;margin:0 0 8px;">✅ Payment Received!</h2>
    <p style="color:#555;margin:0 0 24px;line-height:1.6;">Thank you, ${params.name}. Your payment of <strong>${params.amount}</strong> for booking <strong>${params.bookingNumber}</strong> has been received and confirmed.</p>
    <a href="${params.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#FF7722);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">View Booking →</a>
  `);
}

function buildSevaCompletedHtml(params: {
  name: string;
  bookingNumber: string;
  serviceName: string;
  dashboardUrl: string;
}): string {
  return emailWrapper(`
    <h2 style="color:#1A1A2E;font-family:Georgia,serif;margin:0 0 8px;">🌸 Your Seva is Complete!</h2>
    <p style="color:#555;margin:0 0 24px;line-height:1.6;">Jai Shri Krishna, ${params.name}! Your <strong>${params.serviceName}</strong> (Booking: ${params.bookingNumber}) has been completed with full devotion.</p>
    <p style="color:#555;margin:0 0 24px;line-height:1.6;">Please visit your dashboard to view proof photos and videos from your seva.</p>
    <a href="${params.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#FF7722);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">View Proof →</a>
  `);
}

// =============================================================================
// Email: Refund Confirmation
// =============================================================================

export async function sendRefundConfirmationEmail(params: {
  name: string;
  email: string;
  bookingNumber: string;
  amount: string;
  serviceName: string;
  timeline?: string;
}): Promise<void> {
  const timeline = params.timeline ?? "5-7 business days";
  await getResend().emails.send({
    from: FROM(),
    to: params.email,
    subject: `💰 Refund Processed — ${params.bookingNumber}`,
    html: emailWrapper(`
      <h2 style="color:#8B1E1E;font-family:Georgia,serif;margin:0 0 8px;">Refund Processed</h2>
      <p style="color:#555;margin:0 0 16px;line-height:1.6;">Dear ${params.name},</p>
      <p style="color:#555;margin:0 0 24px;line-height:1.6;">
        We have processed a refund of <strong>${params.amount}</strong> for your
        <strong>${params.serviceName}</strong> booking (<code>${params.bookingNumber}</code>).
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr>
          <td style="padding:10px 14px;background:#F5EEDB;color:#555;font-size:13px;border-radius:6px 0 0 6px;">Refund Amount</td>
          <td style="padding:10px 14px;background:#F5EEDB;color:#2A2825;font-weight:600;font-size:13px;border-radius:0 6px 6px 0;">${params.amount}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#555;font-size:13px;">Timeline</td>
          <td style="padding:10px 14px;color:#2A2825;font-size:13px;">${timeline}</td>
        </tr>
      </table>
      <p style="color:#888;font-size:12px;line-height:1.6;">
        The refund will be credited to your original payment method. If you have any questions, please
        contact us at <a href="mailto:support@vrindavanbhandara.com" style="color:#8B1E1E;">support@vrindavanbhandara.com</a>.
      </p>
    `),
  });
}
