// =============================================================================
// VRINDAVAN BHANDARA — Content Service (public read-only catalog & content)
// =============================================================================

import { Prisma, type ServiceType } from "@prisma/client";
import {
  packageRepository,
  serviceCategoryRepository,
  faqRepository,
  sevaStatRepository,
} from "@/lib/repositories";
import { execute } from "@/lib/api/service";

const SERVICE_TYPES: readonly ServiceType[] = [
  "BHANDARA",
  "BRAHMIN_BHOJ",
  "GAU_SEVA",
  "SADHU_BHOJAN",
  "FESTIVAL_SEVA",
  "ANNADAN_SEVA",
];

function toServiceType(value: string | null): ServiceType | undefined {
  return value && SERVICE_TYPES.includes(value as ServiceType)
    ? (value as ServiceType)
    : undefined;
}

export function listServices() {
  return execute(async () => serviceCategoryRepository.listActivePublic());
}

export function listPublicPackages(query: {
  serviceType?: string | null;
  serviceSlug?: string | null;
}) {
  return execute(async () => {
    const type = toServiceType(query.serviceType ?? null);
    const slug = query.serviceSlug ?? null;

    const where: Prisma.PackageWhereInput =
      type || slug
        ? {
            serviceCategory: {
              ...(type ? { type } : {}),
              ...(slug ? { slug } : {}),
            },
          }
        : {};

    return packageRepository.listPublic(where);
  });
}

export function listFaqs() {
  return execute(async () => faqRepository.listActivePublic());
}

export function listSevaStats() {
  return execute(async () => {
    const stats = await sevaStatRepository.listVisiblePublic();
    // BigInt is not JSON-serializable — convert to number for the wire.
    return stats.map((s) => ({ ...s, value: Number(s.value) }));
  });
}
