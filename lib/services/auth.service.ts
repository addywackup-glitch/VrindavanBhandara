// =============================================================================
// VRINDAVAN BHANDARA — Auth Service
// Source: Phase 2 §4/§8/§9 — Repository -> Service, transactions, typed errors
//
// Owns registration (hash + atomic create) and credential verification (used by
// the NextAuth Credentials provider). Persistence via UserRepository only.
// =============================================================================

import { z } from "zod";
import bcrypt from "bcryptjs";
import type { AdminRole, UserRole } from "@prisma/client";
import { userRepository, runTransaction } from "@/lib/repositories";
import { createAuditLog } from "@/lib/audit";
import { execute, validate } from "@/lib/api/service";
import { type ServiceResult } from "@/lib/api/result";
import { ConflictError } from "@/lib/errors";

const BCRYPT_ROUNDS = 12;

// =============================================================================
// Schemas
// =============================================================================

export const RegisterServiceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export type RegisterServiceInput = z.infer<typeof RegisterServiceSchema>;

export const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// =============================================================================
// DTOs
// =============================================================================

export type RegisteredUser = { id: string; name: string; email: string };

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  adminRole?: AdminRole;
};

// =============================================================================
// Register — atomic create with hashed password
// =============================================================================

export function registerUser(
  input: unknown,
  context?: { ip?: string; userAgent?: string }
): Promise<ServiceResult<RegisteredUser>> {
  return execute(async () => {
    const data = validate(RegisterServiceSchema, input);
    const email = data.email.toLowerCase();
    const phone = data.phone ? data.phone : null;
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await runTransaction(async (tx) => {
      const existing = await userRepository.existsByEmail(email, tx);
      if (existing) {
        throw new ConflictError("An account with this email already exists.");
      }
      return userRepository.create(
        { name: data.name, email, phone, passwordHash, role: "CUSTOMER", isActive: true },
        tx
      );
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      newData: { email: user.email, role: "CUSTOMER" },
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    return { id: user.id, name: user.name, email: user.email };
  }, "Account created successfully");
}

// =============================================================================
// Authenticate — used by the NextAuth Credentials provider
// Returns the user shape NextAuth expects, or null on any failure (no leaks).
// =============================================================================

export async function authenticateCredentials(
  credentials: unknown
): Promise<AuthenticatedUser | null> {
  const parsed = CredentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const email = parsed.data.email.toLowerCase();
  const user = await userRepository.findByEmailWithAdmin(email);

  if (!user || !user.passwordHash || !user.isActive) return null;

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return null;

  await userRepository.touchLastLogin(user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    adminRole: user.admin?.isActive ? user.admin.role : undefined,
  };
}
