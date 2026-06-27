import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "New Post" };

export default async function NewBlogPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  return <BlogEditor mode="new" />;
}
