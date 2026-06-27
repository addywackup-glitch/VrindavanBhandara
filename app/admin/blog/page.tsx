import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Blog" };

type SearchParams = { status?: string; page?: string; search?: string };

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "#6b7280", bg: "#f9fafb" },
  PUBLISHED: { label: "Published", color: "#15803d", bg: "#dcfce7" },
  ARCHIVED: { label: "Archived", color: "#b45309", bg: "#fef9c3" },
};

async function getPosts({ status, page, search }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 20;

  const where = {
    ...(status && status !== "ALL" && { status: status as never }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { excerpt: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (p - 1) * pageSize,
      take: pageSize,
    }),
    prisma.blog.count({ where }),
  ]);

  return { posts, total, page: p, totalPages: Math.ceil(total / pageSize) };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const filterStatus = params.status ?? "ALL";
  const { posts, total, page, totalPages } = await getPosts(params);

  const [drafts, published, archived] = await Promise.all([
    prisma.blog.count({ where: { status: "DRAFT" } }),
    prisma.blog.count({ where: { status: "PUBLISHED" } }),
    prisma.blog.count({ where: { status: "ARCHIVED" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blog</h1>
          <p className="text-gray-500 text-sm mt-1">{total} posts total.</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #8B1E1E, #B89947)" }}
        >
          + New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Drafts", count: drafts, color: "#6b7280" },
          { label: "Published", count: published, color: "#15803d" },
          { label: "Archived", count: archived, color: "#b45309" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-3 mb-4">
        {["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
          <Link
            key={s}
            href={`?status=${s}`}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: filterStatus === s ? "#8B1E1E" : "#F5EEDB",
              color: filterStatus === s ? "white" : "#5A3E2B",
            }}
          >
            {s === "ALL" ? "All" : (STATUS_STYLES[s]?.label ?? s)}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <div className="text-5xl mb-4">✍️</div>
          <h3 className="font-semibold text-gray-700 mb-2">No posts yet</h3>
          <Link href="/admin/blog/new" className="text-sm text-blue-600 hover:underline">Create your first post →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(212,175,55,0.08)", background: "#FDFAF5" }}>
                {["Title", "Author", "Category", "Status", "Published", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const sc = STATUS_STYLES[post.status] ?? STATUS_STYLES["DRAFT"];
                return (
                  <tr key={post.id} className="border-t hover:bg-amber-50/20 transition-colors" style={{ borderColor: "rgba(212,175,55,0.06)" }}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800 text-sm leading-tight line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{post.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{post.authorName}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{post.category ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {post.publishedAt ? post.publishedAt.toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Link href={`/admin/blog/${post.id}/edit`} className="text-xs text-blue-600 hover:underline">
                          Edit
                        </Link>
                        {post.status === "PUBLISHED" && (
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                            View
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="border-t px-5 py-4 flex items-center justify-between" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
              <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && <Link href={`?status=${filterStatus}&page=${page - 1}`} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">← Prev</Link>}
                {page < totalPages && <Link href={`?status=${filterStatus}&page=${page + 1}`} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">Next →</Link>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
