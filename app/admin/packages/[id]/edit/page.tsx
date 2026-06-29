import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PackageFormClient } from "@/components/admin/PackageFormClient";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({ where: { id }, select: { name: true } });
  return { title: pkg ? `Edit ${pkg.name}` : "Edit Package" };
}

export default async function EditPackagePage({ params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;

  const [pkg, categories] = await Promise.all([
    prisma.package.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!pkg) notFound();

  return (
    <>
      <Link href="/admin/packages" className="adm-link" style={{ display: "inline-block", marginBottom: "1.25rem" }}>
        ← Back to Packages
      </Link>
      <PackageFormClient
        categories={categories}
        mode="edit"
        packageId={pkg.id}
        initial={{
          serviceCategoryId: pkg.serviceCategoryId,
          name: pkg.name,
          slug: pkg.slug,
          description: pkg.description,
          shortDesc: pkg.shortDesc,
          price: Number(pkg.price),
          originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : undefined,
          maxGuests: pkg.maxGuests ?? undefined,
          duration: pkg.duration ?? "",
          isCustom: pkg.isCustom,
          isFeatured: pkg.isFeatured,
          isActive: pkg.isActive,
          badge: pkg.badge ?? "",
          metaTitle: pkg.metaTitle ?? "",
          metaDesc: pkg.metaDesc ?? "",
          items: pkg.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit ?? undefined,
            sortOrder: item.sortOrder,
          })),
        }}
      />
    </>
  );
}
