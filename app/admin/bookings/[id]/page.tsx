import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Phone, Mail } from "lucide-react";
import { AdminBookingActions } from "@/components/admin/AdminBookingActions";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Manage Booking" };

async function getBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      user: true,
      package: { include: { serviceCategory: true, items: true } },
      payment: true,
      mediaProofs: { orderBy: { createdAt: "desc" } },
      proofTimeline: { orderBy: { occurredAt: "asc" } },
    },
  });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  COMPLETED: { label: "Completed", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

export default async function AdminBookingDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const fmt = (n: unknown) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG["PENDING"];

  return (
    <div>
      <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-800">
            {booking.package.serviceCategory.name}
          </h1>
          <p className="text-sm text-gray-400 font-mono mt-0.5">{booking.bookingNumber}</p>
        </div>
        <span className={`px-4 py-2 rounded-xl border text-sm font-bold ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: Main Info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Details */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-heading font-bold text-gray-800 mb-4 text-sm">Customer Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Name", value: booking.user.name, icon: null },
                { label: "Email", value: booking.user.email, icon: Mail },
                { label: "Phone", value: booking.user.phone ?? "—", icon: Phone },
                { label: "User ID", value: booking.user.id.slice(-8), icon: null },
              ].map((row) => (
                <div key={row.label}>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-700">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seva Details */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-heading font-bold text-gray-800 mb-4 text-sm">Seva Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Service", value: booking.package.serviceCategory.name },
                { label: "Package", value: booking.package.name },
                { label: "Location", value: booking.sevaLocation },
                {
                  label: "Seva Date",
                  value: new Date(booking.sevaDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
                },
                ...(booking.dedicatedTo ? [{ label: "Dedicated To", value: booking.dedicatedTo }] : []),
                ...(booking.gotra ? [{ label: "Gotra", value: booking.gotra }] : []),
                ...(booking.occasion ? [{ label: "Occasion", value: booking.occasion }] : []),
                ...(booking.specialInstructions ? [{ label: "Special Instructions", value: booking.specialInstructions }] : []),
              ].map((row) => (
                <div key={row.label}>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-700">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Proof Timeline */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-heading font-bold text-gray-800 mb-4 text-sm">Seva Timeline</h2>
            {booking.proofTimeline.length === 0 ? (
              <p className="text-sm text-gray-400">No timeline events yet.</p>
            ) : (
              <div className="relative space-y-0">
                {booking.proofTimeline.map((event, i) => (
                  <div key={event.id} className="flex gap-3 pb-4 last:pb-0 relative">
                    {i < booking.proofTimeline.length - 1 && (
                      <div className="absolute left-3.5 top-7 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)" }}>
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-xs">{event.title}</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">{event.description}</p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {new Date(event.occurredAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Media Proofs */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-heading font-bold text-gray-800 mb-4 text-sm">
              Proof Media ({booking.mediaProofs.length})
            </h2>
            {booking.mediaProofs.length === 0 ? (
              <p className="text-sm text-gray-400">No proof media uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {booking.mediaProofs.map((proof) => (
                  <a
                    key={proof.id}
                    href={proof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                  >
                    {proof.type === "PHOTO" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={proof.url} alt={proof.caption ?? "Proof"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white">
                        <span className="text-2xl">▶</span>
                        <span className="text-[10px] mt-1 text-gray-300">Video</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar — Actions + Payment */}
        <div className="space-y-4">
          {/* Admin Actions (Client Component) */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-heading font-bold text-gray-800 mb-4 text-sm">Admin Actions</h2>
            <AdminBookingActions bookingId={booking.id} currentStatus={booking.status} />
          </div>

          {/* Payment Summary */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-heading font-bold text-gray-800 mb-4 text-sm">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Base</span><span>{fmt(booking.baseAmount)}</span>
              </div>
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-{fmt(booking.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                <span>Total</span>
                <span style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {fmt(booking.totalAmount)}
                </span>
              </div>
            </div>
            {booking.payment && (
              <div className="mt-3 pt-3 border-t border-gray-50 text-[11px] text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Gateway Status</span>
                  <span className="font-semibold text-green-600">{booking.payment.status}</span>
                </div>
                {booking.payment.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span>Payment ID</span>
                    <span className="font-mono truncate max-w-[100px]">{booking.payment.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-heading font-bold text-gray-800 mb-3 text-sm">Quick Links</h2>
            <div className="space-y-2">
              <a
                href={`/dashboard/bookings/${booking.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-600 hover:underline"
              >
                → View customer perspective
              </a>
              <a
                href={`mailto:${booking.user.email}?subject=Re: Your Seva Booking ${booking.bookingNumber}`}
                className="block text-xs text-blue-600 hover:underline"
              >
                → Email customer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
