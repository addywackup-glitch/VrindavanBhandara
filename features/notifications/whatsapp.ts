// =============================================================================
// VRINDAVAN BHANDARA — WhatsApp Notification Service
// Source: 02-system-architecture.md — "WhatsApp Business API for notifications"
//
// Implementation Strategy:
//   Provider: Meta WhatsApp Cloud API (via HTTP fetch — no SDK dependency)
//   Fallback:  Logs to console when WHATSAPP_TOKEN is not set (dev/test mode)
//
// Template IDs must be pre-approved in the Meta Business Manager dashboard.
// Environment variables required:
//   WHATSAPP_TOKEN         - Bearer token from Meta Cloud API
//   WHATSAPP_PHONE_ID      - Phone Number ID from Meta Business Manager
//   WHATSAPP_BUSINESS_ID   - Business Account ID (for reference)
// =============================================================================

const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";

type WhatsAppTextParam = { type: "text"; text: string };
type WhatsAppComponent = {
  type: "header" | "body" | "button";
  parameters: WhatsAppTextParam[];
  sub_type?: "url" | "quick_reply";
  index?: string;
};

interface SendTemplateOptions {
  to: string;            // Phone in international format e.g. "919876543210"
  templateName: string;  // Must be pre-approved in Meta Business Manager
  languageCode?: string;
  components?: WhatsAppComponent[];
}

// =============================================================================
// Core Send Function
// =============================================================================
async function sendWhatsAppTemplate(options: SendTemplateOptions): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    // Dev mode — log the notification that would have been sent
    console.log("[WhatsApp DEV MODE] Would send template:", {
      to: options.to,
      template: options.templateName,
      components: options.components,
    });
    return;
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: options.to.replace(/\D/g, ""), // strip non-digits
    type: "template",
    template: {
      name: options.templateName,
      language: { code: options.languageCode ?? "en" },
      components: options.components ?? [],
    },
  };

  const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("[WhatsApp] Failed to send template:", {
      template: options.templateName,
      to: options.to,
      status: response.status,
      error,
    });
    // Never throw — notification failures must not break the main booking flow
  }
}

// =============================================================================
// Helper — normalize phone to international format
// =============================================================================
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  // Prepend 91 (India) if no country code
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

// =============================================================================
// Template: booking_confirmation
// Sent when: Booking is confirmed after payment
// Variables: {{1}} customer_name, {{2}} booking_number, {{3}} service_name,
//            {{4}} seva_date, {{5}} amount
// =============================================================================
export async function sendWhatsAppBookingConfirmation(params: {
  phone: string | null | undefined;
  name: string;
  bookingNumber: string;
  serviceName: string;
  sevaDate: string;
  amount: string;
}): Promise<void> {
  const to = normalizePhone(params.phone);
  if (!to) return;

  await sendWhatsAppTemplate({
    to,
    templateName: "booking_confirmation",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.name },
          { type: "text", text: params.bookingNumber },
          { type: "text", text: params.serviceName },
          { type: "text", text: params.sevaDate },
          { type: "text", text: params.amount },
        ],
      },
    ],
  });
}

// =============================================================================
// Template: payment_received
// Sent when: Payment is verified via webhook
// Variables: {{1}} customer_name, {{2}} amount, {{3}} booking_number
// =============================================================================
export async function sendWhatsAppPaymentReceived(params: {
  phone: string | null | undefined;
  name: string;
  amount: string;
  bookingNumber: string;
}): Promise<void> {
  const to = normalizePhone(params.phone);
  if (!to) return;

  await sendWhatsAppTemplate({
    to,
    templateName: "payment_received",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.name },
          { type: "text", text: params.amount },
          { type: "text", text: params.bookingNumber },
        ],
      },
    ],
  });
}

// =============================================================================
// Template: seva_in_progress
// Sent when: Admin changes booking status to IN_PROGRESS
// Variables: {{1}} customer_name, {{2}} service_name, {{3}} seva_date
// =============================================================================
export async function sendWhatsAppSevaInProgress(params: {
  phone: string | null | undefined;
  name: string;
  serviceName: string;
  sevaDate: string;
}): Promise<void> {
  const to = normalizePhone(params.phone);
  if (!to) return;

  await sendWhatsAppTemplate({
    to,
    templateName: "seva_in_progress",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.name },
          { type: "text", text: params.serviceName },
          { type: "text", text: params.sevaDate },
        ],
      },
    ],
  });
}

// =============================================================================
// Template: seva_completed
// Sent when: Admin marks booking as COMPLETED (includes dashboard link)
// Variables: {{1}} customer_name, {{2}} service_name, {{3}} dashboard_url
// =============================================================================
export async function sendWhatsAppSevaCompleted(params: {
  phone: string | null | undefined;
  name: string;
  serviceName: string;
  bookingId: string;
}): Promise<void> {
  const to = normalizePhone(params.phone);
  if (!to) return;

  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings/${params.bookingId}`;

  await sendWhatsAppTemplate({
    to,
    templateName: "seva_completed",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.name },
          { type: "text", text: params.serviceName },
          { type: "text", text: dashboardUrl },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: dashboardUrl }],
      },
    ],
  });
}

// =============================================================================
// Template: refund_processed
// Sent when: Admin processes a refund (booking status → REFUNDED)
// Variables: {{1}} customer_name, {{2}} booking_number, {{3}} amount, {{4}} timeline
// =============================================================================
export async function sendWhatsAppRefundProcessed(params: {
  phone: string | null | undefined;
  name: string;
  bookingNumber: string;
  amount: string;
  timeline?: string; // e.g. "5-7 business days"
}): Promise<void> {
  const to = normalizePhone(params.phone);
  if (!to) return;

  await sendWhatsAppTemplate({
    to,
    templateName: "refund_processed",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.name },
          { type: "text", text: params.bookingNumber },
          { type: "text", text: params.amount },
          { type: "text", text: params.timeline ?? "5-7 business days" },
        ],
      },
    ],
  });
}

// =============================================================================
// Template: certificate_ready
// Sent when: Certificate is generated for a completed booking
// Variables: {{1}} customer_name, {{2}} service_name, {{3}} verify_url
// =============================================================================
export async function sendWhatsAppCertificateReady(params: {
  phone: string | null | undefined;
  name: string;
  serviceName: string;
  verifyCode: string;
}): Promise<void> {
  const to = normalizePhone(params.phone);
  if (!to) return;

  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/certificate/${params.verifyCode}`;

  await sendWhatsAppTemplate({
    to,
    templateName: "certificate_ready",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.name },
          { type: "text", text: params.serviceName },
          { type: "text", text: verifyUrl },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: verifyUrl }],
      },
    ],
  });
}

// =============================================================================
// Template: festival_reminder
// Sent when: Admin broadcasts a festival campaign reminder
// Variables: {{1}} customer_name, {{2}} festival_name, {{3}} festival_date, {{4}} booking_url
// =============================================================================
export async function sendWhatsAppFestivalReminder(params: {
  phone: string | null | undefined;
  name: string;
  festivalName: string;
  festivalDate: string;
  campaignSlug: string;
}): Promise<void> {
  const to = normalizePhone(params.phone);
  if (!to) return;

  const bookingUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/book?campaign=${params.campaignSlug}`;

  await sendWhatsAppTemplate({
    to,
    templateName: "festival_reminder",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.name },
          { type: "text", text: params.festivalName },
          { type: "text", text: params.festivalDate },
          { type: "text", text: bookingUrl },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: bookingUrl }],
      },
    ],
  });
}

// =============================================================================
// Template: admin_alert
// Sent when: System sends an alert to admin (e.g. new booking, payment failure)
// Variables: {{1}} alert_type, {{2}} message, {{3}} action_url
// Note: Send to admin phone numbers only — never to customer numbers
// =============================================================================
export async function sendWhatsAppAdminAlert(params: {
  adminPhone: string;
  alertType: string;   // e.g. "New Booking", "Payment Failed"
  message: string;
  actionUrl?: string;
}): Promise<void> {
  const to = normalizePhone(params.adminPhone);
  if (!to) return;

  await sendWhatsAppTemplate({
    to,
    templateName: "admin_alert",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.alertType },
          { type: "text", text: params.message },
          { type: "text", text: params.actionUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "" },
        ],
      },
    ],
  });
}
