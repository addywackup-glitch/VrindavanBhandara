// =============================================================================
// VRINDAVAN BHANDARA — NextAuth v5 Configuration
// Source: PROJECT_RULES.md — "Every protected route must have authorization checks"
// =============================================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authenticateCredentials } from "@/lib/services/auth.service";
import type { SessionUser } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 24 * 60 * 60, updateAge: 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // All credential validation + password verification is centralized in
        // the auth service so it is shared, testable, and consistent.
        return authenticateCredentials(credentials);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On first sign-in 'user' is populated — copy fields into token
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as SessionUser).role;
        token.adminRole = (user as unknown as SessionUser).adminRole;
      }

      // On every token refresh: if role is ADMIN but adminRole is missing
      // (can happen for Google OAuth admins), hydrate from DB
      if (token.role === "ADMIN" && !token.adminRole) {
        try {
          const admin = await prisma.admin.findUnique({
            where: { userId: token.id as string },
            select: { role: true, isActive: true },
          });
          if (admin?.isActive) {
            token.adminRole = admin.role;
          }
        } catch (error) {
          console.error("[auth:jwt] adminRole hydration failed", error);
        }
      }

      // Re-validate account status periodically (every 15 minutes)
      const lastCheck = (token.isActiveCheck as number | undefined) ?? 0;
      if (token.id && Date.now() - lastCheck > 15 * 60 * 1000) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isActive: true,
              role: true,
              admin: { select: { role: true, isActive: true } },
            },
          });
          token.isActiveCheck = Date.now();
          if (!dbUser?.isActive) {
            token.error = "UserInactive";
          } else {
            delete token.error;
            token.role = dbUser.role;
            token.adminRole = dbUser.admin?.isActive ? dbUser.admin.role : undefined;
          }
        } catch (error) {
          console.error("[auth:jwt] session refresh failed", error);
        }
      }

      // On "update" trigger (e.g. session.update() call), re-fetch role from DB
      // so role changes are reflected without forcing a re-login
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { admin: { select: { role: true, isActive: true } } },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.adminRole = dbUser.admin?.isActive ? dbUser.admin.role : undefined;
          }
        } catch {
          // silently ignore
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error === "UserInactive") {
        return { ...session, user: undefined, expires: new Date(0).toISOString() };
      }
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as SessionUser["role"];
        session.user.adminRole = token.adminRole as SessionUser["adminRole"];
      }
      return session;
    },
  },
});
