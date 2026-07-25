// =============================================================================
// /api/admin/faqs/:id — update / delete
// =============================================================================

import { type NextRequest } from "next/server";
import { deleteFaq, updateFaq } from "@/lib/services/faq.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("faqs:write");
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return updateFaq(actor, id, body.data);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("faqs:write");
    const { id } = await params;
    return deleteFaq(actor, id);
  });
}
