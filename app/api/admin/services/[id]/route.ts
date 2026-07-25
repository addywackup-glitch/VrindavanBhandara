// =============================================================================
// /api/admin/services/:id — get / update / delete
// =============================================================================

import { type NextRequest } from "next/server";
import {
  deleteService,
  getAdminService,
  updateService,
} from "@/lib/services/service-category.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    await requireAdmin("services:read");
    const { id } = await params;
    return getAdminService(id);
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("services:write");
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return updateService(actor, id, body.data);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("services:delete");
    const { id } = await params;
    return deleteService(actor, id);
  });
}
