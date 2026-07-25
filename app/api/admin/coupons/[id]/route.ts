// =============================================================================
// /api/admin/coupons/:id — update (PATCH) and delete (DELETE)
// =============================================================================

import { type NextRequest } from "next/server";
import { deleteCoupon, updateCoupon } from "@/lib/services/coupon.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("coupons:write");
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return updateCoupon(actor, id, body.data);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("coupons:write");
    const { id } = await params;
    return deleteCoupon(actor, id);
  });
}
