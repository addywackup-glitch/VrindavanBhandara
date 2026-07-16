// =============================================================================
// VRINDAVAN BHANDARA — Auth Service (Supabase Auth + Prisma profile)
// Registration creates auth.users via service role, then Prisma User row.
// Credential verification for NextAuth is removed — login uses /api/auth/login.
// =============================================================================

import { z } from "zod";
import type { AdminRole, UserRole } from "@prisma/client";
import { userRepository } from "@/lib/repositories";
import { createAuditLog } from "@/lib/audit";
import { execute, validate } from "@/lib/api/service";
import { type ServiceResult } from "@/lib/api/result";
import { ConflictError, ValidationError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

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
// Register — Supabase Auth user + Prisma profile
// =============================================================================

export function registerUser(
  input: unknown,
  context?: { ip?: string; userAgent?: string }
): Promise<ServiceResult<RegisteredUser>> {
  return execute(async () => {
    const data = validate(RegisterServiceSchema, input);
    const email = data.email.toLowerCase();
    const phone = data.phone ? data.phone : null;

    const existing = await userRepository.existsByEmail(email);
    if (existing) {
      throw new ConflictError("An account with this email already exists.");
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (err) {
      console.error("[registerUser] Supabase admin client failed", err);
      throw new ValidationError(
        "Auth is not configured (missing SUPABASE_SERVICE_ROLE_KEY). Check Vercel environment variables."
      );
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, full_name: data.name },
    });

    if (error || !created.user) {
      const msg = error?.message ?? "Could not create auth account";
      console.error("[registerUser] Supabase createUser failed", msg);
      if (msg.toLowerCase().includes("already")) {
        throw new ConflictError("An account with this email already exists.");
      }
      throw new ValidationError(msg);
    }

    const supabaseUserId = created.user.id;

    try {
      const user = await userRepository.create({
        name: data.name,
        email,
        phone,
        supabaseUserId,
        role: "CUSTOMER",
        isActive: true,
        emailVerified: new Date(),
      });

      await createAuditLog({
        userId: user.id,
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        newData: { email: user.email, role: "CUSTOMER", supabaseUserId },
        ip: context?.ip,
        userAgent: context?.userAgent,
      });

      return { id: user.id, name: user.name, email: user.email };
    } catch (err) {
      // Roll back Auth user if Prisma profile create fails
      console.error("[registerUser] Prisma profile create failed", err);
      await admin.auth.admin.deleteUser(supabaseUserId);
      throw err;
    }
  }, "Account created successfully");
}
