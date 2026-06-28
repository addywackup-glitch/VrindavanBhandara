// =============================================================================
// /api/admin/messages/:id — update (PATCH) and delete (DELETE).
// =============================================================================

import { type NextRequest } from "next/server";
import { deleteMessage, updateMessage } from "@/lib/services/message.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("bookings:read");
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return updateMessage(actor, id, body.data);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("bookings:write");
    const { id } = await params;
    return deleteMessage(actor, id);
  });
}
