// =============================================================================
// POST /api/coupons/preview — validate coupon + preview discount (auth required)
// =============================================================================

import { type NextRequest } from "next/server";
import { previewCoupon } from "@/lib/services/coupon.service";
import { handle, parseJsonBody, requireActor } from "@/lib/api/http";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const actor = await requireActor();
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return previewCoupon(actor, body.data);
  });
}
