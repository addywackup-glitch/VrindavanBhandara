import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PackageFormClient } from "@/components/admin/PackageFormClient";

export const metadata: Metadata = { title: "New Package" };

export default async function NewPackagePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-title">No service categories</div>
        <p className="adm-empty-desc">Add service categories before creating packages.</p>
        <Link href="/admin/packages" className="adm-link" style={{ marginTop: "1rem" }}>← Back to Packages</Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/admin/packages" className="adm-link" style={{ display: "inline-block", marginBottom: "1.25rem" }}>
        ← Back to Packages
      </Link>
      <PackageFormClient categories={categories} mode="create" />
    </>
  );
}
