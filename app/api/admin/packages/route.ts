// =============================================================================
// /api/admin/packages — list (GET) and create (POST). Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { createPackage, listPackages } from "@/lib/services/package.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const actor = await requireAdmin("packages:read");
    const { searchParams } = new URL(request.url);
    return listPackages(actor, {
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      search: searchParams.get("search"),
      categoryId: searchParams.get("categoryId"),
      isActive: searchParams.get("isActive"),
      sortBy: searchParams.get("sortBy"),
      sortDir: searchParams.get("sortDir"),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const actor = await requireAdmin("packages:write");
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return createPackage(actor, body.data);
    },
    { successStatus: 201 }
  );
}
