// =============================================================================
// Booking invoice PDF (pdf-lib — serverless-friendly)
// =============================================================================

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/utils";

export type InvoiceBooking = {
  bookingNumber: string;
  sevaDate: Date;
  sevaLocation: string;
  guestCount: number;
  dedicatedTo: string | null;
  gotra: string | null;
  occasion: string | null;
  baseAmount: { toNumber(): number } | number;
  discountAmount: { toNumber(): number } | number;
  taxAmount: { toNumber(): number } | number;
  totalAmount: { toNumber(): number } | number;
  status: string;
  user: { name: string; email: string; phone: string | null };
  package: {
    name: string;
    serviceCategory: { name: string };
  };
  payment: {
    status: string;
    razorpayPaymentId: string | null;
  } | null;
  coupon: { code: string } | null;
};

function n(v: { toNumber(): number } | number): number {
  return typeof v === "number" ? v : v.toNumber();
}

export async function buildBookingInvoicePdf(
  booking: InvoiceBooking
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const brand = rgb(0.72, 0.45, 0.12);
  const ink = rgb(0.12, 0.12, 0.16);
  const muted = rgb(0.4, 0.4, 0.45);

  let y = 800;
  const left = 50;

  const draw = (text: string, opts: { x?: number; size?: number; f?: typeof font; color?: ReturnType<typeof rgb> } = {}) => {
    page.drawText(text, {
      x: opts.x ?? left,
      y,
      size: opts.size ?? 11,
      font: opts.f ?? font,
      color: opts.color ?? ink,
    });
  };

  draw("Vrindavan Bhandara", { size: 20, f: bold, color: brand });
  y -= 22;
  draw("Seva Invoice", { size: 12, color: muted });
  y -= 36;

  draw(`Invoice / Booking: ${booking.bookingNumber}`, { f: bold, size: 12 });
  y -= 18;
  draw(`Status: ${booking.status}`);
  y -= 16;
  draw(`Issued: ${new Date().toLocaleDateString("en-IN")}`);
  y -= 28;

  draw("Devotee", { f: bold, size: 12, color: brand });
  y -= 18;
  draw(booking.user.name);
  y -= 16;
  draw(booking.user.email, { color: muted });
  y -= 16;
  if (booking.user.phone) {
    draw(booking.user.phone, { color: muted });
    y -= 16;
  }
  y -= 12;

  draw("Seva details", { f: bold, size: 12, color: brand });
  y -= 18;
  draw(`Service: ${booking.package.serviceCategory.name}`);
  y -= 16;
  draw(`Package: ${booking.package.name}`);
  y -= 16;
  draw(`Date: ${formatDate(booking.sevaDate)}`);
  y -= 16;
  draw(`Location: ${booking.sevaLocation}`);
  y -= 16;
  draw(`Guests: ${booking.guestCount}`);
  y -= 16;
  if (booking.dedicatedTo) {
    draw(`Dedicated to: ${booking.dedicatedTo}`);
    y -= 16;
  }
  if (booking.gotra) {
    draw(`Gotra: ${booking.gotra}`);
    y -= 16;
  }
  if (booking.occasion) {
    draw(`Occasion: ${booking.occasion}`);
    y -= 16;
  }
  y -= 12;

  draw("Amounts", { f: bold, size: 12, color: brand });
  y -= 18;
  draw(`Base: ${formatCurrency(n(booking.baseAmount))}`);
  y -= 16;
  if (n(booking.discountAmount) > 0) {
    const code = booking.coupon?.code ? ` (${booking.coupon.code})` : "";
    draw(`Discount${code}: −${formatCurrency(n(booking.discountAmount))}`, {
      color: rgb(0.15, 0.45, 0.25),
    });
    y -= 16;
  }
  if (n(booking.taxAmount) > 0) {
    draw(`Tax: ${formatCurrency(n(booking.taxAmount))}`);
    y -= 16;
  }
  draw(`Total: ${formatCurrency(n(booking.totalAmount))}`, { f: bold, size: 13 });
  y -= 28;

  if (booking.payment) {
    draw("Payment", { f: bold, size: 12, color: brand });
    y -= 18;
    draw(`Status: ${booking.payment.status}`);
    y -= 16;
    if (booking.payment.razorpayPaymentId) {
      draw(`Payment ID: ${booking.payment.razorpayPaymentId}`, { size: 10, color: muted });
      y -= 16;
    }
  }

  y = 70;
  draw("Thank you for your seva contribution.", { size: 10, color: muted });
  y -= 14;
  draw("This is a computer-generated invoice from Vrindavan Bhandara.", {
    size: 9,
    color: muted,
  });

  return doc.save();
}
