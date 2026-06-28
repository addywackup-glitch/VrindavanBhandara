// =============================================================================
// /api/admin/blog — list (GET) and create (POST). Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { createBlog, listBlogs } from "@/lib/services/blog.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const actor = await requireAdmin("blogs:read");
    const { searchParams } = new URL(request.url);
    return listBlogs(actor, {
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const actor = await requireAdmin("blogs:write");
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return createBlog(actor, body.data);
    },
    { successStatus: 201 }
  );
}
