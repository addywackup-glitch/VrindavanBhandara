// =============================================================================
// /api/admin/coupons — list (GET) and create (POST)
// =============================================================================

import { type NextRequest } from "next/server";
import { createCoupon, listAdminCoupons } from "@/lib/services/coupon.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const actor = await requireAdmin("coupons:read");
    const { searchParams } = new URL(request.url);
    return listAdminCoupons(actor, {
      search: searchParams.get("search"),
      isActive: searchParams.get("isActive"),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const actor = await requireAdmin("coupons:write");
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return createCoupon(actor, body.data);
    },
    { successStatus: 201 }
  );
}
