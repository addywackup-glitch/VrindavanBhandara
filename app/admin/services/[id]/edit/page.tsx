import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ServiceFormClient } from "@/components/admin/ServiceFormClient";
import { ServiceTypeEnum } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const service = await prisma.serviceCategory.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: service ? `Edit ${service.name}` : "Edit Service" };
}

export default async function EditServicePage({ params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const service = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!service) notFound();

  const used = await prisma.serviceCategory.findMany({ select: { type: true } });
  const usedSet = new Set(used.map((u) => u.type));
  const availableTypes = ServiceTypeEnum.options.filter(
    (t) => !usedSet.has(t) || t === service.type
  );

  return (
    <>
      <Link href="/admin/services" className="adm-link" style={{ display: "inline-block", marginBottom: "1.25rem" }}>
        ← Back to Services
      </Link>
      <ServiceFormClient
        mode="edit"
        serviceId={service.id}
        availableTypes={availableTypes}
        initial={{
          type: service.type,
          name: service.name,
          slug: service.slug,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon ?? "",
          image: service.image ?? "",
          isActive: service.isActive,
          sortOrder: service.sortOrder,
          metaTitle: service.metaTitle ?? "",
          metaDesc: service.metaDesc ?? "",
          pageSections: service.pageSections,
        }}
      />
    </>
  );
}
