import { type NextRequest } from "next/server";
import { listAdmins, promoteAdmin } from "@/lib/services/admin.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

export async function GET() {
  return handle(async () => {
    const actor = await requireAdmin("admins:manage");
    return listAdmins(actor);
  });
}

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const actor = await requireAdmin("admins:manage");
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return promoteAdmin(actor, body.data);
    },
    { successStatus: 201 }
  );
}
