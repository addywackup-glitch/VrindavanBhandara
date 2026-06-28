// =============================================================================
// /api/admin/blog/:id — get (GET), update (PATCH), delete (DELETE).
// =============================================================================

import { type NextRequest } from "next/server";
import { deleteBlog, getBlog, updateBlog } from "@/lib/services/blog.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    await requireAdmin("blogs:read");
    const { id } = await params;
    return getBlog(id);
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("blogs:write");
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return updateBlog(actor, id, body.data);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireAdmin("blogs:delete");
    const { id } = await params;
    return deleteBlog(actor, id);
  });
}
