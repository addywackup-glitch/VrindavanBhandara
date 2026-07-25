import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { CouponsClient } from "@/components/admin/CouponsClient";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");
  if (!session.user.adminRole || !hasPermission(session.user.adminRole, "coupons:read")) {
    redirect("/admin");
  }

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Coupons</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {coupons.length} coupon{coupons.length !== 1 ? "s" : ""} — applied at booking create
          </p>
        </div>
      </div>

      <CouponsClient
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          description: c.description,
          discountType: c.discountType,
          discountValue: c.discountValue.toString(),
          minOrderValue: c.minOrderValue?.toString() ?? null,
          maxDiscount: c.maxDiscount?.toString() ?? null,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          isActive: c.isActive,
          expiresAt: c.expiresAt,
        }))}
      />
    </>
  );
}
