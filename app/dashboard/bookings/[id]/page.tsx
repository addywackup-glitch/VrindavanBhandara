import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, CheckCircle } from "lucide-react";

type Params = { params: Promise<{ id: string }> };

async function getBooking(id: string, userId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        package: { include: { serviceCategory: true, items: true } },
        payment: true,
        mediaProofs: { orderBy: { createdAt: "desc" } },
        proofTimeline: { orderBy: { occurredAt: "asc" } },
      },
    });
    if (!booking || booking.userId !== userId) return null;
    return booking;
  } catch {
    return null;
  }
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", label: "Pending Payment" },
  CONFIRMED: { color: "text-green-700", bg: "bg-green-50 border-green-200", label: "Payment Confirmed" },
  IN_PROGRESS: { color: "text-saffron-700", bg: "bg-saffron-50 border-saffron-200", label: "Seva In Progress" },
  COMPLETED: { color: "text-green-700", bg: "bg-green-50 border-green-200", label: "Seva Completed" },
  CANCELLED: { color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Cancelled" },
};

export default async function BookingDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const booking = await getBooking(id, session.user.id);
  if (!booking) notFound();

  const status = STATUS_CONFIG[booking.status] ?? { color: "text-gray-700", bg: "bg-gray-50 border-gray-200", label: booking.status };
  const formatPrice = (n: unknown) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));

  return (
    <div>
      {/* Back */}
      <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gold-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl text-charcoal">{booking.package.serviceCategory.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{booking.bookingNumber}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border text-sm font-semibold ${status.bg} ${status.color}`}>
          {status.label}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Seva Info Card */}
          <div className="card-luxury p-6">
            <h2 className="font-heading text-base font-bold text-charcoal mb-4">Seva Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Service", value: booking.package.serviceCategory.name },
                { label: "Package", value: booking.package.name },
                { label: "Location", value: booking.sevaLocation },
                {
                  label: "Seva Date",
                  value: new Date(booking.sevaDate).toLocaleDateString("en-IN", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  }),
                },
                ...(booking.dedicatedTo ? [{ label: "Dedicated To", value: booking.dedicatedTo }] : []),
                ...(booking.gotra ? [{ label: "Gotra", value: booking.gotra }] : []),
                ...(booking.occasion ? [{ label: "Occasion", value: booking.occasion }] : []),
              ].map((row) => (
                <div key={row.label}>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{row.label}</span>
                  <span className="text-sm font-semibold text-charcoal">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Proof Timeline */}
          {booking.proofTimeline.length > 0 && (
            <div className="card-luxury p-6">
              <h2 className="font-heading text-base font-bold text-charcoal mb-5">Seva Progress</h2>
              <div className="relative">
                {booking.proofTimeline.map((event, i) => (
                  <div key={event.id} className="flex gap-4 pb-6 last:pb-0 relative">
                    {/* Connector */}
                    {i < booking.proofTimeline.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-gold-200" />
                    )}
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0 shadow-glow-gold">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    {/* Content */}
                    <div>
                      <p className="font-semibold text-charcoal text-sm">{event.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{event.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {new Date(event.occurredAt).toLocaleString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo/Video Proofs */}
          {booking.mediaProofs.length > 0 && (
            <div className="card-luxury p-6">
              <h2 className="font-heading text-base font-bold text-charcoal mb-4">
                Seva Photos &amp; Videos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {booking.mediaProofs.map((proof) => (
                  <a
                    key={proof.id}
                    href={proof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:shadow-card-hover transition-shadow"
                  >
                    {String(proof.type) === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={proof.url} alt={proof.caption ?? "Proof"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-charcoal text-white text-2xl">
                        ▶
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-5">
          {/* Price Summary */}
          <div className="card-luxury p-5">
            <h3 className="font-heading text-sm font-bold text-charcoal mb-4">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Base Amount</span>
                <span>{formatPrice(booking.baseAmount)}</span>
              </div>
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(booking.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-charcoal border-t border-gray-100 pt-2 mt-2">
                <span>Total Paid</span>
                <span className="text-gradient-gold">{formatPrice(booking.totalAmount)}</span>
              </div>
            </div>
            {booking.payment && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                <p>Payment: <span className="font-semibold text-green-600">{booking.payment.status}</span></p>
                {booking.payment.razorpayPaymentId && (
                  <p className="mt-0.5 truncate">ID: {booking.payment.razorpayPaymentId}</p>
                )}
              </div>
            )}
          </div>
          {/* Location */}
          <div
            className="p-4 rounded-xl text-sm"
            style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}
          >
            <div className="flex items-center gap-2 text-charcoal font-semibold mb-1">
              <MapPin className="w-4 h-4 text-gold-500" />
              {booking.sevaLocation === "VRINDAVAN" ? "Vrindavan" : "Mathura"}
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              Seva performed at the holy dham of{" "}
              {booking.sevaLocation === "VRINDAVAN"
                ? "Vrindavan, Uttar Pradesh"
                : "Mathura, Uttar Pradesh"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
