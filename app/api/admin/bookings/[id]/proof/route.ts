import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

// =============================================================================
// POST /api/admin/bookings/[id]/proof
// Add media proof (photo/video) to a booking
// Requires: ADMIN role
// BUG FIX: The client sends type "IMAGE" | "VIDEO" but the schema expected
//           "PHOTO" | "VIDEO" | "DOCUMENT" causing all image proof uploads to fail
//           with a 400 validation error. Normalized to match the prisma enum.
// =============================================================================

type Params = { params: Promise<{ id: string }> };

const ProofSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  // Accept both "IMAGE" (from client UI) and "PHOTO" (legacy) and map to DB enum
  type: z.enum(["IMAGE", "VIDEO", "PHOTO", "DOCUMENT"]).transform((v) =>
    v === "IMAGE" ? "PHOTO" : v
  ),
  caption: z.string().max(200).optional(),
  isPublic: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ProofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { url, type, caption, isPublic } = parsed.data;

  // Verify booking exists
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const proof = await prisma.mediaProof.create({
    data: {
      bookingId: id,
      url,
      type: type as "PHOTO" | "VIDEO" | "DOCUMENT",
      caption: caption ?? null,
      isPublic,
      uploadedBy: session.user.id,
    },
  });

  // Add timeline event for first proof upload only
  const existingProofsCount = await prisma.mediaProof.count({ where: { bookingId: id } });
  if (existingProofsCount === 1) {
    await prisma.proofTimelineEvent.create({
      data: {
        bookingId: id,
        eventType: "PHOTOS_UPLOADED",
        title: "Proof Uploaded",
        description: "Photo/video proof of your seva has been uploaded.",
        createdBy: session.user.id,
        isVisible: true,
      },
    });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "MediaProof",
    entityId: proof.id,
    metadata: { bookingId: id, type, url },
  });

  return NextResponse.json({ success: true, data: proof }, { status: 201 });
}

// GET /api/admin/bookings/[id]/proof — List proofs for a booking
export async function GET(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const proofs = await prisma.mediaProof.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: proofs });
}
