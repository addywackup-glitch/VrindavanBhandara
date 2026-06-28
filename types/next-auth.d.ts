import type { SessionUser } from "@/types";

declare module "next-auth" {
  interface Session {
    user: SessionUser & {
      email: string;
      name: string;
      image?: string | null;
    };
  }

  // Augment NextAuth's User with our custom fields (declared inline rather than
  // `extends SessionUser {}` to avoid an empty-interface lint rule). Optional so
  // OAuth/adapter-created users (which lack these initially) still type-check.
  interface User {
    role?: SessionUser["role"];
    adminRole?: SessionUser["adminRole"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: SessionUser["role"];
    adminRole?: SessionUser["adminRole"];
  }
}
