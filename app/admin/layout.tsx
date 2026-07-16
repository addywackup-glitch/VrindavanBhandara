import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import type { Metadata } from "next";

// Auth uses cookies — never statically prerender admin routes
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin Panel — Vrindavan Bhandara", template: "%s | Admin — Vrindavan Bhandara" },
  robots: { index: false, follow: false },
};

async function getNavCounts() {
  try {
    const [pendingBookings, refundRequests] = await Promise.all([
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: { in: ["REFUNDED"] } } }),
    ]);
    return { pendingBookings, refundRequests };
  } catch {
    return { pendingBookings: 0, refundRequests: 0 };
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { pendingBookings } = await getNavCounts();

  return (
    <AdminShell session={session} pendingBookings={pendingBookings}>
      {children}
    </AdminShell>
  );
}
