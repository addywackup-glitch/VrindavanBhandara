// =============================================================================
// /api/admin/faqs — list (GET) and create (POST)
// =============================================================================

import { type NextRequest } from "next/server";
import { createFaq, listAdminFaqs } from "@/lib/services/faq.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const actor = await requireAdmin("faqs:write");
    const { searchParams } = new URL(request.url);
    return listAdminFaqs(actor, {
      search: searchParams.get("search"),
      serviceType: searchParams.get("serviceType"),
      isActive: searchParams.get("isActive"),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const actor = await requireAdmin("faqs:write");
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return createFaq(actor, body.data);
    },
    { successStatus: 201 }
  );
}
