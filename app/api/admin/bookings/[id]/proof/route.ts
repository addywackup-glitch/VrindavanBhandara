// =============================================================================
// /api/admin/bookings/:id/proof — add (POST) and list (GET) media proofs.
// =============================================================================

import { type NextRequest } from "next/server";
import { addProof, listProofs } from "@/lib/services/media.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  return handle(
    async () => {
      const actor = await requireAdmin("proofs:upload");
      const { id } = await params;
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return addProof(actor, id, body.data);
    },
    { successStatus: 201 }
  );
}

export async function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    await requireAdmin("bookings:read");
    const { id } = await params;
    return listProofs(id);
  });
}
