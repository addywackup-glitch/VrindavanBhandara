// =============================================================================
// Sync Supabase Auth users ↔ Prisma User (+ Admin RBAC).
// App authorization remains on Prisma User.role / Admin.role.
// =============================================================================

import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { AdminRole, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { userRepository } from "@/lib/repositories";
import type { SessionUser } from "@/types";

export type AppSession = {
  user: SessionUser & {
    email: string;
    name: string;
    image?: string | null;
  };
  expires: string;
};

function toSessionUser(params: {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  adminRole?: AdminRole | null;
}): AppSession["user"] {
  return {
    id: params.id,
    name: params.name,
    email: params.email,
    image: params.image,
    role: params.role,
    adminRole: params.adminRole ?? undefined,
  };
}

/**
 * Find or create the Prisma profile for a Supabase Auth user.
 * Links via `supabaseUserId`, falling back to email match for legacy rows.
 */
export async function syncPrismaUserFromSupabase(
  authUser: SupabaseAuthUser,
  extras?: { name?: string; phone?: string | null }
): Promise<AppSession["user"] | null> {
  const email = (authUser.email ?? "").toLowerCase();
  if (!email) return null;

  const metaName =
    extras?.name ??
    (typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : undefined) ??
    (typeof authUser.user_metadata?.name === "string"
      ? authUser.user_metadata.name
      : undefined) ??
    email.split("@")[0] ??
    "Devotee";

  const image =
    typeof authUser.user_metadata?.avatar_url === "string"
      ? authUser.user_metadata.avatar_url
      : typeof authUser.user_metadata?.picture === "string"
        ? authUser.user_metadata.picture
        : null;

  let user = await prisma.user.findUnique({
    where: { supabaseUserId: authUser.id },
    include: { admin: { select: { role: true, isActive: true } } },
  });

  if (!user) {
    const byEmail = await prisma.user.findUnique({
      where: { email },
      include: { admin: { select: { role: true, isActive: true } } },
    });

    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          supabaseUserId: authUser.id,
          emailVerified: authUser.email_confirmed_at
            ? new Date(authUser.email_confirmed_at)
            : byEmail.emailVerified,
          image: byEmail.image ?? image,
          name: byEmail.name || metaName,
          ...(extras?.phone ? { phone: extras.phone } : {}),
          lastLoginAt: new Date(),
        },
        include: { admin: { select: { role: true, isActive: true } } },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: metaName,
          email,
          phone: extras?.phone ?? null,
          image,
          supabaseUserId: authUser.id,
          emailVerified: authUser.email_confirmed_at
            ? new Date(authUser.email_confirmed_at)
            : null,
          role: "CUSTOMER",
          isActive: true,
          lastLoginAt: new Date(),
        },
        include: { admin: { select: { role: true, isActive: true } } },
      });
    }
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        image: user.image ?? image,
      },
      include: { admin: { select: { role: true, isActive: true } } },
    });
  }

  if (!user.isActive) return null;

  // Keep Edge proxy redirects accurate by mirroring role into app_metadata.
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(authUser.id, {
      app_metadata: {
        ...(authUser.app_metadata ?? {}),
        role: user.role,
        prismaUserId: user.id,
      },
    });
  } catch (error) {
    console.error("[auth:sync] app_metadata update failed", error);
  }

  return toSessionUser({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    adminRole: user.admin?.isActive ? user.admin.role : null,
  });
}

export async function getAppSessionFromSupabaseUser(
  authUser: SupabaseAuthUser | null
): Promise<AppSession | null> {
  if (!authUser) return null;
  const profile = await syncPrismaUserFromSupabase(authUser);
  if (!profile) return null;

  return {
    user: profile,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/** Migrate a legacy bcrypt user into Supabase Auth (one-time bridge). */
export async function migrateLegacyPasswordUser(params: {
  email: string;
  password: string;
}): Promise<{ supabaseUserId: string } | null> {
  const email = params.email.toLowerCase();
  const existing = await userRepository.findByEmailWithAdmin(email);
  if (!existing?.passwordHash || !existing.isActive) return null;

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(params.password, existing.passwordHash);
  if (!valid) return null;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // Prefer create; if already exists in Auth, look up and link.
  const created = await admin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
    user_metadata: { name: existing.name, full_name: existing.name },
  });

  let supabaseUserId = created.data.user?.id;

  if (!supabaseUserId) {
    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = listed.data.users.find(
      (u) => (u.email ?? "").toLowerCase() === email
    );
    supabaseUserId = match?.id;
  }

  if (!supabaseUserId) return null;

  await prisma.user.update({
    where: { id: existing.id },
    data: { supabaseUserId },
  });

  return { supabaseUserId };
}
