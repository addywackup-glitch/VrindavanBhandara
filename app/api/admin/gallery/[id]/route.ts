// =============================================================================
// /api/admin/gallery/:id — update (PATCH) and delete (DELETE).
// =============================================================================

import { type NextRequest } from "next/server";
import {
  deleteGalleryImage,
  updateGalleryImage,
} from "@/lib/services/gallery.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("gallery:write");
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return updateGalleryImage(actor, id, body.data);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("gallery:write");
    const { id } = await params;
    return deleteGalleryImage(actor, id);
  });
}
