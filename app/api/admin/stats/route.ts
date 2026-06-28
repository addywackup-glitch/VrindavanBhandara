// =============================================================================
// GET /api/admin/stats — dashboard metrics. Thin adapter.
// =============================================================================

import { getDashboardStats } from "@/lib/services/analytics.service";
import { handle, requireAdmin } from "@/lib/api/http";

export async function GET() {
  return handle(async () => {
    await requireAdmin("analytics:read");
    return getDashboardStats();
  });
}
