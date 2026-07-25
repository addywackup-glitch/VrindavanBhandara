// =============================================================================
// VRINDAVAN BHANDARA — Coupon service (pricing + admin CRUD)
// =============================================================================

import { Prisma, type Coupon, type DiscountType, type ServiceType } from "@prisma/client";
import { couponRepository, packageRepository } from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import {
  CreateCouponSchema,
  PreviewCouponSchema,
  UpdateCouponSchema,
} from "@/lib/validations";
import type { Actor } from "@/lib/services/actor";

export type CouponPricing = {
  discountAmount: number;
  couponId: string | null;
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
};

/** Validate + price a coupon. Throws ValidationError when not applicable. */
export async function evaluateCoupon(
  code: string | undefined,
  baseAmount: number,
  serviceType: ServiceType,
  packageId: string
): Promise<CouponPricing> {
  if (!code?.trim()) return { discountAmount: 0, couponId: null };

  const normalized = code.trim().toUpperCase();
  const coupon = await couponRepository.findByCode(normalized);
  const now = new Date();
  const usable =
    coupon &&
    coupon.isActive &&
    (!coupon.expiresAt || coupon.expiresAt > now) &&
    (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
    (!coupon.minOrderValue || baseAmount >= coupon.minOrderValue.toNumber()) &&
    (coupon.applicableServices.length === 0 ||
      coupon.applicableServices.includes(serviceType)) &&
    (coupon.applicablePackages.length === 0 ||
      coupon.applicablePackages.includes(packageId));

  if (!coupon || !usable) {
    throw new ValidationError(
      "This coupon is invalid, expired, or not applicable to the selected package."
    );
  }

  let discountAmount: number;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (baseAmount * coupon.discountValue.toNumber()) / 100;
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount.toNumber());
    }
  } else {
    discountAmount = coupon.discountValue.toNumber();
  }
  discountAmount = Math.min(discountAmount, baseAmount);
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    discountAmount,
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toNumber(),
  };
}

export function previewCoupon(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(PreviewCouponSchema, input);
    const pkg = await packageRepository.findActiveWithCategory(data.packageId);
    if (!pkg) throw new NotFoundError("Package");

    const baseAmount = pkg.price.toNumber();
    const pricing = await evaluateCoupon(
      data.code,
      baseAmount,
      pkg.serviceCategory.type,
      pkg.id
    );

    return {
      code: pricing.code,
      discountAmount: pricing.discountAmount,
      baseAmount,
      totalAmount: baseAmount - pricing.discountAmount,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
    };
  });
}

export function listAdminCoupons(actor: Actor, query: {
  search?: string | null;
  isActive?: string | null;
}) {
  return execute(async () => {
    const search = query.search?.trim() ?? "";
    const where: Prisma.CouponWhereInput = {
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(query.isActive === "true" || query.isActive === "false"
        ? { isActive: query.isActive === "true" }
        : {}),
    };

    const items = await couponRepository.listAdmin({ where });

    await createAuditLog({
      userId: actor.userId,
      action: "READ",
      entity: "Coupon",
      metadata: { search },
    });

    return { items };
  });
}

import type { CreateCouponInput } from "@/lib/validations";

function toCouponCreateData(
  data: CreateCouponInput
): Prisma.CouponUncheckedCreateInput {
  return {
    code: data.code.trim().toUpperCase(),
    description: data.description ?? null,
    discountType: data.discountType,
    discountValue: data.discountValue,
    minOrderValue: data.minOrderValue ?? null,
    maxDiscount: data.maxDiscount ?? null,
    maxUses: data.maxUses ?? null,
    isActive: data.isActive,
    expiresAt: data.expiresAt ?? null,
    applicableServices: data.applicableServices ?? [],
    applicablePackages: data.applicablePackages ?? [],
  };
}

export function createCoupon(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(CreateCouponSchema, input);
    const code = data.code.trim().toUpperCase();
    const existing = await couponRepository.findByCode(code);
    if (existing) throw new ConflictError(`Coupon code "${code}" already exists.`);

    const coupon = await couponRepository.create(toCouponCreateData({ ...data, code }));

    await createAuditLog({
      userId: actor.userId,
      action: "CREATE",
      entity: "Coupon",
      entityId: coupon.id,
      newData: { code: coupon.code, discountType: coupon.discountType },
    });

    return coupon;
  }, "Coupon created");
}

export function updateCoupon(actor: Actor, id: string, input: unknown) {
  return execute(async () => {
    const data = validate(UpdateCouponSchema, input);
    const existing = await couponRepository.findById(id);
    if (!existing) throw new NotFoundError("Coupon");

    if (data.code) {
      const code = data.code.trim().toUpperCase();
      const clash = await couponRepository.findByCode(code);
      if (clash && clash.id !== id) {
        throw new ConflictError(`Coupon code "${code}" already exists.`);
      }
    }

    const updated = await couponRepository.update(id, {
      ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.discountType !== undefined ? { discountType: data.discountType } : {}),
      ...(data.discountValue !== undefined ? { discountValue: data.discountValue } : {}),
      ...(data.minOrderValue !== undefined ? { minOrderValue: data.minOrderValue } : {}),
      ...(data.maxDiscount !== undefined ? { maxDiscount: data.maxDiscount } : {}),
      ...(data.maxUses !== undefined ? { maxUses: data.maxUses } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
      ...(data.applicableServices !== undefined
        ? { applicableServices: data.applicableServices }
        : {}),
      ...(data.applicablePackages !== undefined
        ? { applicablePackages: data.applicablePackages }
        : {}),
    });

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "Coupon",
      entityId: id,
      oldData: { code: existing.code, isActive: existing.isActive },
      newData: data,
    });

    return updated;
  }, "Coupon updated");
}

export function deleteCoupon(actor: Actor, id: string) {
  return execute(async () => {
    const existing = await couponRepository.findById(id);
    if (!existing) throw new NotFoundError("Coupon");

    try {
      await couponRepository.delete(id);
    } catch {
      // Soft-disable if usages/bookings reference it
      await couponRepository.update(id, { isActive: false });
      await createAuditLog({
        userId: actor.userId,
        action: "UPDATE",
        entity: "Coupon",
        entityId: id,
        metadata: { deactivated: true, reason: "in_use" },
      });
      return { message: "Coupon deactivated (already used on bookings)" };
    }

    await createAuditLog({
      userId: actor.userId,
      action: "DELETE",
      entity: "Coupon",
      entityId: id,
      metadata: { code: existing.code },
    });

    return { message: "Coupon deleted" };
  });
}

export type { Coupon };
