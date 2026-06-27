import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ContactMessage } from "@prisma/client";
import { MessagesClient } from "@/components/admin/MessagesClient";

export const metadata: Metadata = { title: "Messages" };

type SearchParams = { status?: string; page?: string };

async function getMessages({ status, page }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 20;

  const where = {
    ...(status === "UNREAD" && { isRead: false }),
    ...(status === "READ" && { isRead: true }),
    ...(status === "REPLIED" && { isReplied: true }),
  };

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      skip: (p - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  return { messages, total, page: p, totalPages: Math.ceil(total / pageSize) };
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const filter = params.status ?? "ALL";
  const { messages, total, page, totalPages } = await getMessages(params);

  const [unread, replied] = await Promise.all([
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.contactMessage.count({ where: { isReplied: true } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        <p className="text-gray-500 text-sm mt-1">{total} total messages. {unread} unread.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Unread", count: unread, color: "#8B1E1E", bg: "#FDF2F2" },
          { label: "Total", count: total, color: "#1d4ed8", bg: "#EFF6FF" },
          { label: "Replied", count: replied, color: "#15803d", bg: "#F0FDF4" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <MessagesClient
        messages={(messages as ContactMessage[]).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
        total={total}
        page={page}
        totalPages={totalPages}
        filter={filter}
      />
    </div>
  );
}
