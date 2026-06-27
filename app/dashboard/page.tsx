import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock, ArrowRight, Award } from "lucide-react";

async function getDashboardData(userId: string) {
  try {
    const [bookingStats, recentBookings] = await Promise.all([
      prisma.booking.groupBy({
        by: ["status"],
        where: { userId },
        _count: { status: true },
      }),
      prisma.booking.findMany({
        where: { userId },
        include: {
          package: { include: { serviceCategory: true } },
          payment: { select: { status: true, capturedAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const stats = {
      total: bookingStats.reduce((s, g) => s + g._count.status, 0),
      confirmed: bookingStats.find((g) => g.status === "CONFIRMED")?._count.status ?? 0,
      completed: bookingStats.find((g) => g.status === "COMPLETED")?._count.status ?? 0,
      pending: bookingStats.find((g) => g.status === "PENDING")?._count.status ?? 0,
    };

    return { stats, recentBookings };
  } catch {
    return { stats: { total: 0, confirmed: 0, completed: 0, pending: 0 }, recentBookings: [] };
  }
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending Payment", className: "badge badge-gold" },
  CONFIRMED: { label: "Confirmed", className: "badge badge-green" },
  IN_PROGRESS: { label: "In Progress", className: "badge badge-saffron" },
  COMPLETED: { label: "Completed", className: "badge badge-green" },
  CANCELLED: { label: "Cancelled", className: "badge badge-red" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { stats, recentBookings } = await getDashboardData(session.user.id);

  const STAT_CARDS = [
    {
      label: "Total Sevas",
      value: stats.total,
      icon: BookOpen,
      bg: "linear-gradient(135deg, rgba(184,153,71,0.12), rgba(184,153,71,0.06))",
      border: "rgba(184,153,71,0.2)",
      iconColor: "#B89947",
    },
    {
      label: "Confirmed",
      value: stats.confirmed,
      icon: CheckCircle,
      bg: "linear-gradient(135deg, rgba(21,128,61,0.08), rgba(21,128,61,0.04))",
      border: "rgba(21,128,61,0.15)",
      iconColor: "#15803d",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: Award,
      bg: "linear-gradient(135deg, rgba(139,30,30,0.08), rgba(184,153,71,0.06))",
      border: "rgba(139,30,30,0.12)",
      iconColor: "#8B1E1E",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      bg: "linear-gradient(135deg, rgba(107,114,128,0.07), rgba(107,114,128,0.03))",
      border: "rgba(107,114,128,0.12)",
      iconColor: "#6b7280",
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl md:text-3xl" style={{ color: "#2A2825" }}>
          Jai Shri Krishna, {session.user.name?.split(" ")[0]} 🙏
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          Here&apos;s an overview of your seva journey.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, bg, border, iconColor }) => (
          <div
            key={label}
            className="rounded-2xl p-5"
            style={{
              background: bg,
              border: `1px solid ${border}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                {label}
              </span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${iconColor}18` }}
              >
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
              </div>
            </div>
            <span className="text-3xl font-bold font-heading" style={{ color: "#2A2825" }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="card-luxury p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-bold text-charcoal">Recent Bookings</h2>
          <Link
            href="/dashboard/bookings"
            className="text-sm text-gold-500 hover:text-gold-700 font-semibold flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🙏</div>
            <p className="text-gray-500 mb-4">No bookings yet</p>
            <Link href="/book" className="btn-gold px-6 py-2.5 text-sm">
              Book Your First Seva
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => {
              const badge = STATUS_BADGE[booking.status] ?? {
                label: booking.status,
                className: "badge",
              };
              return (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gold-50 transition-colors group border border-transparent hover:border-gold-100"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,119,34,0.1))" }}
                  >
                    {booking.package.serviceCategory.icon ?? "🙏"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal truncate">
                      {booking.package.serviceCategory.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {booking.bookingNumber} &middot;{" "}
                      {new Date(booking.sevaDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={badge.className}>{badge.label}</span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
