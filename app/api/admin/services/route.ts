// =============================================================================
// /api/admin/services — list (GET) and create (POST)
// =============================================================================

import { type NextRequest } from "next/server";
import {
  createService,
  listAdminServices,
} from "@/lib/services/service-category.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const actor = await requireAdmin("services:read");
    const { searchParams } = new URL(request.url);
    return listAdminServices(actor, {
      search: searchParams.get("search"),
      isActive: searchParams.get("isActive"),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const actor = await requireAdmin("services:write");
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return createService(actor, body.data);
    },
    { successStatus: 201 }
  );
}
