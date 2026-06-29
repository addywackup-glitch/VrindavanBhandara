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
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Messages</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {total} total · {unread} unread
          </p>
        </div>
      </div>

      <div className="adm-stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Unread", value: unread },
          { label: "Total", value: total },
          { label: "Replied", value: replied },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value">{s.value}</div>
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
    </>
  );
}
