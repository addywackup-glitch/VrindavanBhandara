import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "Edit Post" };

type Params = { params: Promise<{ id: string }> };

export default async function EditBlogPage({ params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const post = await prisma.blog.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <BlogEditor
      mode="edit"
      initialData={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage ?? "",
        tags: post.tags,
        category: post.category ?? "",
        metaTitle: post.metaTitle ?? "",
        metaDesc: post.metaDesc ?? "",
        status: post.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        readTimeMin: post.readTimeMin,
      }}
    />
  );
}
