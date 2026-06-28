// =============================================================================
// /api/admin/settings — list (GET) and upsert (POST). Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { listSettings, upsertSetting } from "@/lib/services/settings.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

export async function GET() {
  return handle(async () => {
    await requireAdmin("config:write");
    return listSettings();
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const actor = await requireAdmin("config:write");
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return upsertSetting(actor, body.data);
  });
}
