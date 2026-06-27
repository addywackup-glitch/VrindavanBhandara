import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "badge badge-gold" },
  CONFIRMED: { label: "Confirmed", cls: "badge badge-green" },
  IN_PROGRESS: { label: "In Progress", cls: "badge badge-saffron" },
  COMPLETED: { label: "Completed", cls: "badge badge-green" },
  CANCELLED: { label: "Cancelled", cls: "badge badge-red" },
  REFUNDED: { label: "Refunded", cls: "badge" },
};

async function getBookings(userId: string) {
  try {
    return await prisma.booking.findMany({
      where: { userId },
      include: {
        package: { include: { serviceCategory: true } },
        payment: { select: { status: true, capturedAt: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const bookings = await getBookings(session.user.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-charcoal">My Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">
            {bookings.length} seva{bookings.length !== 1 ? "s" : ""} booked
          </p>
        </div>
        <Link href="/book" className="btn-gold px-5 py-2.5 text-sm">
          <Plus className="w-4 h-4 mr-1" />
          Book Seva
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="card-luxury p-16 text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="font-heading text-xl text-charcoal mb-2">No bookings yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            Begin your spiritual journey by booking your first seva.
          </p>
          <Link href="/book" className="btn-gold px-8 py-3">Book Your First Seva</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const badge = STATUS_BADGE[booking.status] ?? { label: booking.status, cls: "badge" };
            const formatPrice = (n: unknown) =>
              new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));

            return (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="card-luxury p-5 flex items-start gap-4 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,119,34,0.1))" }}
                >
                  {booking.package.serviceCategory.icon ?? "🙏"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-charcoal text-sm group-hover:text-gold-600 transition-colors">
                        {booking.package.serviceCategory.name} — {booking.package.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {booking.bookingNumber} &middot; {booking.sevaLocation}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={badge.cls}>{badge.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-3 flex-wrap">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Seva Date</span>
                      <span className="text-xs font-medium text-charcoal">
                        {new Date(booking.sevaDate).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Amount</span>
                      <span className="text-xs font-bold text-gold-600">
                        {formatPrice(booking.totalAmount)}
                      </span>
                    </div>
                    {booking.payment?.capturedAt && (
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Paid On</span>
                        <span className="text-xs font-medium text-charcoal">
                          {new Date(booking.payment.capturedAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 transition-colors mt-1 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
