// =============================================================================
// /api/admin/packages/:id — get (GET), update (PATCH), delete (DELETE).
// =============================================================================

import { type NextRequest } from "next/server";
import {
  deletePackage,
  getPackage,
  updatePackage,
} from "@/lib/services/package.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    await requireAdmin("packages:read");
    const { id } = await params;
    return getPackage(id);
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("packages:write");
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return updatePackage(actor, id, body.data);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("packages:delete");
    const { id } = await params;
    return deletePackage(actor, id);
  });
}
