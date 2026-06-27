"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save, Send, Archive, Bold, Italic, Link2, List, Image, Heading2, Heading3, Code } from "lucide-react";

type PostData = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
  metaTitle?: string;
  metaDesc?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  readTimeMin?: number;
};

type Props = { initialData?: PostData; mode: "new" | "edit" };

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

const TOOLBAR_ACTIONS = [
  { label: "H2", icon: Heading2, insert: (t: string) => `\n## ${t || "Heading"}\n` },
  { label: "H3", icon: Heading3, insert: (t: string) => `\n### ${t || "Heading"}\n` },
  { label: "Bold", icon: Bold, insert: (t: string) => `**${t || "bold text"}**` },
  { label: "Italic", icon: Italic, insert: (t: string) => `_${t || "italic text"}_` },
  { label: "Link", icon: Link2, insert: (t: string) => `[${t || "link text"}](url)` },
  { label: "List", icon: List, insert: (t: string) => `\n- ${t || "Item 1"}\n- Item 2\n- Item 3\n` },
  { label: "Image", icon: Image, insert: (_: string) => `\n![Alt text](https://your-image-url.com)\n` },
  { label: "Code", icon: Code, insert: (t: string) => `\`${t || "code"}\`` },
];

export function BlogEditor({ initialData, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState<PostData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    tags: [],
    category: "",
    metaTitle: "",
    metaDesc: "",
    status: "DRAFT",
    readTimeMin: 5,
    ...initialData,
  });

  const update = useCallback(<K extends keyof PostData>(key: K, value: PostData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTitleChange = (title: string) => {
    update("title", title);
    if (!initialData?.slug) {
      update("slug", slugify(title));
    }
    if (!initialData?.metaTitle) {
      update("metaTitle", title.slice(0, 70));
    }
  };

  const handleContentChange = (content: string) => {
    update("content", content);
    update("readTimeMin", estimateReadTime(content));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags?.includes(tag)) {
      update("tags", [...(form.tags ?? []), tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    update("tags", form.tags?.filter((t) => t !== tag) ?? []);
  };

  const insertMarkdown = (insertFn: (selection: string) => string) => {
    const textarea = document.getElementById("blog-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content?.slice(start, end) ?? "";
    const inserted = insertFn(selected);
    const newContent = (form.content?.slice(0, start) ?? "") + inserted + (form.content?.slice(end) ?? "");
    handleContentChange(newContent);
    setTimeout(() => {
      textarea.setSelectionRange(start + inserted.length, start + inserted.length);
      textarea.focus();
    }, 0);
  };

  async function save(status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    if (!form.title?.trim()) { alert("Title is required"); return; }
    if (!form.slug?.trim()) { alert("Slug is required"); return; }
    if (!form.content || form.content.length < 100) { alert("Content must be at least 100 characters"); return; }
    if (!form.excerpt?.trim()) { alert("Excerpt is required"); return; }

    setSaving(true);
    try {
      const url = mode === "new" ? "/api/admin/blog" : `/api/admin/blog/${initialData?.id}`;
      const method = mode === "new" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save");
      }

      if (mode === "new") {
        router.push(`/admin/blog/${data.data.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Simple markdown preview renderer
  function renderPreview(md: string) {
    return md
      .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold mt-6 mb-3 text-gray-800'>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-4 mb-2 text-gray-700'>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code class='bg-gray-100 px-1 rounded text-sm font-mono'>$1</code>")
      .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
      .replace(/\[(.+?)\]\((.+?)\)/g, "<a href='$2' class='text-blue-600 underline'>$1</a>")
      .replace(/!\[(.+?)\]\((.+?)\)/g, "<img src='$2' alt='$1' class='rounded-xl my-4 max-w-full' />")
      .replace(/\n\n/g, "</p><p class='mb-4 text-gray-700 leading-relaxed'>")
      .replace(/^(?!<[h|l|p])(.+)$/gm, "<p class='mb-4 text-gray-700 leading-relaxed'>$1</p>");
  }

  const SECTION_CLASS = "bg-white rounded-2xl border p-6";
  const BORDER = { borderColor: "rgba(212,175,55,0.1)" };
  const INPUT_CLASS = "w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300";
  const LABEL_CLASS = "block text-xs font-semibold text-gray-500 mb-1.5";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{mode === "new" ? "New Post" : "Edit Post"}</h1>
          {form.status && (
            <span className="text-xs text-gray-400 mt-0.5">
              Status: <strong>{form.status}</strong> · ~{form.readTimeMin} min read
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => save("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors hover:bg-gray-50"
            style={{ borderColor: "rgba(212,175,55,0.2)" }}
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={() => save("ARCHIVED")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors"
            style={{ borderColor: "rgba(212,175,55,0.2)", color: "#b45309" }}
          >
            <Archive size={14} />
            Archive
          </button>
          <button
            onClick={() => save("PUBLISHED")}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #8B1E1E, #B89947)" }}
          >
            <Send size={14} />
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor — 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className={SECTION_CLASS} style={BORDER}>
            <label className={LABEL_CLASS}>Title *</label>
            <input
              id="blog-title"
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter a compelling post title…"
              className={INPUT_CLASS}
              style={{ borderColor: "rgba(212,175,55,0.2)", fontSize: "1.1rem", fontWeight: 600 }}
            />
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-gray-400">Slug:</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                className="flex-1 px-3 py-1 text-xs border rounded-lg font-mono focus:outline-none"
                style={{ borderColor: "rgba(212,175,55,0.15)" }}
              />
            </div>
          </div>

          {/* Content editor */}
          <div className={SECTION_CLASS} style={BORDER}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              {TOOLBAR_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => insertMarkdown(action.insert)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                  title={action.label}
                >
                  <action.icon size={13} />
                </button>
              ))}
              <div className="ml-auto flex rounded-lg border overflow-hidden text-xs" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
                <button
                  onClick={() => setActiveTab("write")}
                  className="px-3 py-1.5 font-semibold transition-colors"
                  style={{ background: activeTab === "write" ? "#F5EEDB" : "white", color: "#5A3E2B" }}
                >
                  Write
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className="px-3 py-1.5 font-semibold flex items-center gap-1 transition-colors"
                  style={{ background: activeTab === "preview" ? "#F5EEDB" : "white", color: "#5A3E2B" }}
                >
                  <Eye size={11} /> Preview
                </button>
              </div>
            </div>

            {activeTab === "write" ? (
              <textarea
                id="blog-content"
                value={form.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your post content in Markdown…&#10;&#10;## Getting Started&#10;&#10;Write your introduction here.&#10;&#10;## Main Section&#10;&#10;Add your content…"
                className="w-full h-96 px-4 py-3 text-sm border rounded-xl font-mono resize-y focus:outline-none focus:ring-2 focus:ring-amber-200"
                style={{ borderColor: "rgba(212,175,55,0.15)", lineHeight: 1.7 }}
              />
            ) : (
              <div
                className="min-h-96 px-4 py-3 border rounded-xl overflow-auto prose max-w-none"
                style={{ borderColor: "rgba(212,175,55,0.15)" }}
                dangerouslySetInnerHTML={{ __html: renderPreview(form.content ?? "") }}
              />
            )}

            <p className="text-[11px] text-gray-400 mt-2">
              {(form.content ?? "").split(/\s+/).filter(Boolean).length} words · ~{form.readTimeMin} min read
            </p>
          </div>

          {/* Excerpt */}
          <div className={SECTION_CLASS} style={BORDER}>
            <label className={LABEL_CLASS}>Excerpt * <span className="font-normal text-gray-400">(shown in listings)</span></label>
            <textarea
              value={form.excerpt}
              onChange={(e) => {
                update("excerpt", e.target.value);
                if (!form.metaDesc) update("metaDesc", e.target.value.slice(0, 160));
              }}
              placeholder="A brief summary of the post (max 500 chars)…"
              rows={3}
              maxLength={500}
              className={INPUT_CLASS + " resize-none"}
              style={{ borderColor: "rgba(212,175,55,0.2)" }}
            />
            <p className="text-[11px] text-gray-400 mt-1">{(form.excerpt ?? "").length}/500</p>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-5">
          {/* Cover image */}
          <div className={SECTION_CLASS} style={BORDER}>
            <label className={LABEL_CLASS}>Cover Image URL</label>
            <input
              type="url"
              value={form.coverImage}
              onChange={(e) => update("coverImage", e.target.value)}
              placeholder="https://…"
              className={INPUT_CLASS}
              style={{ borderColor: "rgba(212,175,55,0.2)" }}
            />
            {form.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.coverImage} alt="Cover" className="mt-3 w-full h-32 object-cover rounded-xl" />
            )}
            <p className="text-[11px] text-gray-400 mt-2">R2 upload integration coming in Phase 2.</p>
          </div>

          {/* Tags */}
          <div className={SECTION_CLASS} style={BORDER}>
            <label className={LABEL_CLASS}>Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag…"
                className={INPUT_CLASS + " flex-1"}
                style={{ borderColor: "rgba(212,175,55,0.2)" }}
              />
              <button onClick={addTag} className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {form.tags?.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-600 ml-0.5">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Category & Read time */}
          <div className={SECTION_CLASS} style={BORDER}>
            <label className={LABEL_CLASS}>Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="e.g. Festivals, Spiritual"
              className={INPUT_CLASS}
              style={{ borderColor: "rgba(212,175,55,0.2)" }}
            />
          </div>

          {/* SEO */}
          <div className={SECTION_CLASS} style={BORDER}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">SEO</h3>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLASS}>Meta Title <span className="font-normal">(max 70)</span></label>
                <input
                  type="text"
                  value={form.metaTitle}
                  onChange={(e) => update("metaTitle", e.target.value)}
                  maxLength={70}
                  className={INPUT_CLASS}
                  style={{ borderColor: "rgba(212,175,55,0.2)" }}
                />
                <p className="text-[11px] text-gray-400 mt-1">{(form.metaTitle ?? "").length}/70</p>
              </div>
              <div>
                <label className={LABEL_CLASS}>Meta Description <span className="font-normal">(max 160)</span></label>
                <textarea
                  value={form.metaDesc}
                  onChange={(e) => update("metaDesc", e.target.value)}
                  maxLength={160}
                  rows={3}
                  className={INPUT_CLASS + " resize-none"}
                  style={{ borderColor: "rgba(212,175,55,0.2)" }}
                />
                <p className="text-[11px] text-gray-400 mt-1">{(form.metaDesc ?? "").length}/160</p>
              </div>
            </div>
          </div>

          {/* Cover image note */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs text-amber-800">
              <strong>Scheduled posts:</strong> Set status to Draft and update{" "}
              <code>publishedAt</code> via the API. Scheduled publish UI coming in Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
