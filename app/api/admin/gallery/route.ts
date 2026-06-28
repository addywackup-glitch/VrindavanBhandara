// =============================================================================
// /api/admin/gallery — list (GET) and create (POST). Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import {
  createGalleryImage,
  listGallery,
} from "@/lib/services/gallery.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin("gallery:write");
    const { searchParams } = new URL(request.url);
    return listGallery({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      category: searchParams.get("category"),
      search: searchParams.get("search"),
      isFeatured: searchParams.get("isFeatured"),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const actor = await requireAdmin("gallery:write");
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return createGalleryImage(actor, body.data);
    },
    { successStatus: 201 }
  );
}
