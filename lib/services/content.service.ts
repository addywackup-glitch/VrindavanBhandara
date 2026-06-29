// =============================================================================
// VRINDAVAN BHANDARA — Content Service (public read-only catalog & content)
// =============================================================================

import { Prisma, type ServiceType } from "@prisma/client";
import {
  packageRepository,
  serviceCategoryRepository,
  faqRepository,
  galleryRepository,
  testimonialRepository,
  sevaStatRepository,
} from "@/lib/repositories";
import { execute } from "@/lib/api/service";
import { NotFoundError } from "@/lib/errors";
import { parseServicePageSections } from "@/lib/validations";

const SERVICE_TYPES: readonly ServiceType[] = [
  "BHANDARA",
  "BRAHMIN_BHOJ",
  "GAU_SEVA",
  "SADHU_BHOJAN",
  "FESTIVAL_SEVA",
  "ANNADAN_SEVA",
  "VIDHWA_SEVA",
];

export function toServiceType(value: string | null): ServiceType | undefined {
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

export function listFaqs(query: { serviceType?: string | null } = {}) {
  return execute(async () =>
    faqRepository.listActivePublic({
      serviceType: toServiceType(query.serviceType ?? null),
    })
  );
}

export function listGallery(query: { serviceType?: string | null; limit?: number } = {}) {
  return execute(async () =>
    galleryRepository.listPublic({
      serviceType: toServiceType(query.serviceType ?? null),
      limit: query.limit,
    })
  );
}

// ---------------------------------------------------------------------------
// Aggregate: everything a single service page needs in one round-trip.
// service + packages + service-scoped FAQs + gallery + testimonials + related.
// ---------------------------------------------------------------------------
export function getServicePage(slug: string) {
  return execute(async () => {
    const service = await serviceCategoryRepository.findPublicBySlug(slug);
    if (!service) throw new NotFoundError("Service");

    const [faqs, gallery, testimonials, relatedServices] = await Promise.all([
      faqRepository.listActivePublic({ serviceType: service.type }),
      galleryRepository.listPublic({ serviceType: service.type, limit: 12 }),
      testimonialRepository.listPublic({
        where: { isApproved: true, serviceType: service.type },
        take: 12,
      }),
      serviceCategoryRepository.listRelated(service.id, 4),
    ]);

    const { pageSections, packages, ...rest } = service;

    return {
      service: { ...rest, pageSections: parseServicePageSections(pageSections) },
      packages,
      faqs,
      gallery,
      testimonials,
      relatedServices,
    };
  });
}

export function listSevaStats() {
  return execute(async () => {
    const stats = await sevaStatRepository.listVisiblePublic();
    // BigInt is not JSON-serializable — convert to number for the wire.
    return stats.map((s) => ({ ...s, value: Number(s.value) }));
  });
}
