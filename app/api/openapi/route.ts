// =============================================================================
// GET /api/openapi  — machine-readable OpenAPI 3.1 document
// =============================================================================

import { NextResponse } from "next/server";
import { openApiDocument } from "@/lib/openapi/spec";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(openApiDocument);
}
