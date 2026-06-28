// =============================================================================
// GET /api/admin/bookings — list all bookings (admin). Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { adminListBookings } from "@/lib/services/admin.service";
import { handle, requireAdmin } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin("bookings:read");
    const { searchParams } = new URL(request.url);
    return adminListBookings({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      status: searchParams.get("status"),
      search: searchParams.get("search"),
    });
  });
}
