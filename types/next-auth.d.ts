import type { SessionUser } from "@/types";

declare module "next-auth" {
  interface Session {
    user: SessionUser & {
      email: string;
      name: string;
      image?: string | null;
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Required for NextAuth module augmentation; extending User is how you add custom fields
  interface User extends SessionUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: SessionUser["role"];
    adminRole?: SessionUser["adminRole"];
  }
}
