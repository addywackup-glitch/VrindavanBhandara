// =============================================================================
// /api/admin/testimonials/:id — moderate (PATCH) and delete (DELETE).
// =============================================================================

import { type NextRequest } from "next/server";
import {
  deleteTestimonial,
  moderateTestimonial,
} from "@/lib/services/testimonial.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("testimonials:approve");
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return moderateTestimonial(actor, id, body.data);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("testimonials:approve");
    const { id } = await params;
    return deleteTestimonial(actor, id);
  });
}
