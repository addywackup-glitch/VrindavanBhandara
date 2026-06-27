"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  isReplied: boolean;
  adminNotes: string | null;
  createdAt: string;
};

type Props = { messages: Message[]; total: number; page: number; totalPages: number; filter: string };

export function MessagesClient({ messages, total, page, totalPages, filter }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  async function markRead(id: string) {
    setLoadingId(id + "read");
    try {
      await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      startTransition(() => router.refresh());
    } finally {
      setLoadingId(null);
    }
  }

  async function markReplied(id: string) {
    setLoadingId(id + "replied");
    try {
      await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReplied: true, isRead: true }),
      });
      startTransition(() => router.refresh());
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm("Delete this message?")) return;
    setLoadingId(id + "delete");
    try {
      await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      startTransition(() => router.refresh());
    } finally {
      setLoadingId(null);
    }
  }

  const FILTERS = ["ALL", "UNREAD", "READ", "REPLIED"];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-3 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("status", f);
              params.delete("page");
              router.push(`?${params.toString()}`);
            }}
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: filter === f ? "#8B1E1E" : "#F5EEDB",
              color: filter === f ? "white" : "#5A3E2B",
            }}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{total} messages</span>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <div className="text-5xl mb-4">📭</div>
          <h3 className="font-semibold text-gray-700">No messages</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
              style={{
                borderColor: !msg.isRead ? "rgba(139,30,30,0.3)" : "rgba(212,175,55,0.1)",
                background: !msg.isRead ? "#FFF9F9" : "white",
              }}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                onClick={() => {
                  setExpanded(expanded === msg.id ? null : msg.id);
                  if (!msg.isRead) markRead(msg.id);
                }}
              >
                <div className="shrink-0">
                  {msg.isRead ? (
                    <MailOpen size={16} className="text-gray-300" />
                  ) : (
                    <Mail size={16} style={{ color: "#8B1E1E" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-800">{msg.name}</p>
                    <span className="text-gray-300 text-xs">·</span>
                    <p className="text-xs text-gray-500 truncate">{msg.email}</p>
                    {msg.phone && <p className="text-xs text-gray-400">{msg.phone}</p>}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{msg.subject}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {msg.isReplied && (
                    <span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">Replied</span>
                  )}
                  <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              </div>

              {/* Expanded message */}
              {expanded === msg.id && (
                <div className="border-t px-5 py-4" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{msg.message}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markReplied(msg.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "#dcfce7", color: "#15803d" }}
                    >
                      <Reply size={12} />
                      Reply via Email
                    </a>
                    {!msg.isReplied && (
                      <button
                        onClick={() => markReplied(msg.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: "#eff6ff", color: "#1d4ed8" }}
                        disabled={!!loadingId}
                      >
                        {loadingId === msg.id + "replied" ? "…" : "Mark as Replied"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      disabled={!!loadingId}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ml-auto"
                      style={{ background: "#fee2e2", color: "#b91c1c" }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-8">
          {page > 1 && (
            <button
              onClick={() => { const p = new URLSearchParams(window.location.search); p.set("page", String(page - 1)); router.push(`?${p}`); }}
              className="px-4 py-2 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold"
            >
              ← Prev
            </button>
          )}
          <span className="px-4 py-2 text-xs text-gray-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <button
              onClick={() => { const p = new URLSearchParams(window.location.search); p.set("page", String(page + 1)); router.push(`?${p}`); }}
              className="px-4 py-2 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
