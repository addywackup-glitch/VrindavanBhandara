import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authRateLimit } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255).toLowerCase(),
  phone: z.string().optional(),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await authRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many registration attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { name, email, phone, password } = parsed.data;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone ?? null,
      passwordHash,
      role: "CUSTOMER",
      isActive: true,
    },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(
    { success: true, data: user, message: "Account created successfully" },
    { status: 201 }
  );
}
