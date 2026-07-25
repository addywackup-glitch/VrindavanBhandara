import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ServiceFormClient } from "@/components/admin/ServiceFormClient";
import { ServiceTypeEnum } from "@/lib/validations";

export const metadata: Metadata = { title: "New Service" };

export default async function NewServicePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const used = await prisma.serviceCategory.findMany({ select: { type: true } });
  const usedSet = new Set(used.map((u) => u.type));
  const availableTypes = ServiceTypeEnum.options.filter((t) => !usedSet.has(t));

  return (
    <>
      <Link href="/admin/services" className="adm-link" style={{ display: "inline-block", marginBottom: "1.25rem" }}>
        ← Back to Services
      </Link>
      <ServiceFormClient mode="create" availableTypes={availableTypes} />
    </>
  );
}
