import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/admin/SettingsClient";

export const metadata: Metadata = { title: "Settings" };

const SETTING_GROUPS: Record<string, { label: string; emoji: string }> = {
  general: { label: "General", emoji: "🏠" },
  branding: { label: "Branding", emoji: "🎨" },
  payments: { label: "Payments", emoji: "💳" },
  email: { label: "Email", emoji: "📧" },
  whatsapp: { label: "WhatsApp", emoji: "💬" },
  seo: { label: "SEO", emoji: "🔍" },
  social: { label: "Social Links", emoji: "🔗" },
  business: { label: "Business Info", emoji: "🏢" },
  legal: { label: "Legal", emoji: "⚖️" },
  media: { label: "Media", emoji: "📁" },
};

// Default settings scaffold if DB is empty
const DEFAULT_SETTINGS: Array<{
  key: string;
  label: string;
  type: "string" | "boolean" | "number";
  group: string;
  placeholder?: string;
}> = [
  // General
  { key: "site.name", label: "Site Name", type: "string", group: "general", placeholder: "Vrindavan Bhandara" },
  { key: "site.tagline", label: "Tagline", type: "string", group: "general", placeholder: "Sacred Seva, Delivered" },
  { key: "site.maintenanceMode", label: "Maintenance Mode", type: "boolean", group: "general" },
  // Branding
  { key: "brand.logoUrl", label: "Logo URL", type: "string", group: "branding", placeholder: "https://…" },
  { key: "brand.faviconUrl", label: "Favicon URL", type: "string", group: "branding", placeholder: "https://…" },
  { key: "brand.primaryColor", label: "Primary Color", type: "string", group: "branding", placeholder: "#8B1E1E" },
  // Payments
  { key: "payments.razorpayEnabled", label: "Razorpay Enabled", type: "boolean", group: "payments" },
  { key: "payments.taxPercent", label: "Tax Percent (%)", type: "number", group: "payments", placeholder: "0" },
  { key: "payments.minOrderAmount", label: "Min Order Amount (₹)", type: "number", group: "payments", placeholder: "100" },
  // Email
  { key: "email.fromName", label: "From Name", type: "string", group: "email", placeholder: "Vrindavan Bhandara" },
  { key: "email.fromEmail", label: "From Email", type: "string", group: "email", placeholder: "seva@vrindavanbhandara.com" },
  { key: "email.replyTo", label: "Reply-To Email", type: "string", group: "email", placeholder: "support@vrindavanbhandara.com" },
  // WhatsApp
  { key: "whatsapp.enabled", label: "WhatsApp Notifications Enabled", type: "boolean", group: "whatsapp" },
  { key: "whatsapp.businessName", label: "Business Name", type: "string", group: "whatsapp", placeholder: "Vrindavan Bhandara" },
  // SEO
  { key: "seo.defaultTitle", label: "Default Page Title", type: "string", group: "seo" },
  { key: "seo.defaultDescription", label: "Default Meta Description", type: "string", group: "seo" },
  { key: "seo.ogImage", label: "Default OG Image URL", type: "string", group: "seo" },
  // Social
  { key: "social.instagram", label: "Instagram URL", type: "string", group: "social" },
  { key: "social.facebook", label: "Facebook URL", type: "string", group: "social" },
  { key: "social.youtube", label: "YouTube URL", type: "string", group: "social" },
  { key: "social.twitter", label: "X / Twitter URL", type: "string", group: "social" },
  // Business
  { key: "business.phone", label: "Support Phone", type: "string", group: "business", placeholder: "+91 XXXXXXXXXX" },
  { key: "business.email", label: "Support Email", type: "string", group: "business" },
  { key: "business.address", label: "Address", type: "string", group: "business" },
  // Legal
  { key: "legal.privacyUrl", label: "Privacy Policy URL", type: "string", group: "legal" },
  { key: "legal.termsUrl", label: "Terms of Service URL", type: "string", group: "legal" },
  { key: "legal.refundUrl", label: "Refund Policy URL", type: "string", group: "legal" },
  // Media
  { key: "media.r2BucketUrl", label: "R2 Bucket Base URL", type: "string", group: "media", placeholder: "https://r2.vrindavanbhandara.com" },
  { key: "media.maxFileSizeMb", label: "Max Upload Size (MB)", type: "number", group: "media", placeholder: "50" },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const savedSettings = await prisma.siteConfig.findMany({
    orderBy: { group: "asc" },
  });

  // Merge saved values into defaults
  const savedMap = Object.fromEntries(savedSettings.map((s) => [s.key, s.value]));

  const settingsByGroup = DEFAULT_SETTINGS.reduce<Record<string, typeof DEFAULT_SETTINGS>>((acc, setting) => {
    const group = setting.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push({ ...setting });
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage site configuration. Changes take effect immediately.
        </p>
      </div>

      {/* Group navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.entries(SETTING_GROUPS).map(([key, { label, emoji }]) => (
          <a
            key={key}
            href={`#group-${key}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border hover:shadow-sm transition-shadow"
            style={{ borderColor: "rgba(212,175,55,0.2)", color: "#5A3E2B" }}
          >
            <span>{emoji}</span>
            {label}
          </a>
        ))}
      </div>

      <div className="space-y-8">
        {Object.entries(settingsByGroup).map(([group, settings]) => {
          const groupMeta = SETTING_GROUPS[group] ?? { label: group, emoji: "⚙️" };
          return (
            <div
              key={group}
              id={`group-${group}`}
              className="bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: "rgba(212,175,55,0.1)" }}
            >
              <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(212,175,55,0.08)", background: "#FDFAF5" }}>
                <span className="text-lg">{groupMeta.emoji}</span>
                <h2 className="font-bold text-gray-700 text-sm">{groupMeta.label}</h2>
              </div>
              <div className="p-6 space-y-4">
                {settings.map((setting) => (
                  <SettingsClient
                    key={setting.key}
                    settingKey={setting.key}
                    label={setting.label}
                    type={setting.type}
                    placeholder={setting.placeholder}
                    initialValue={savedMap[setting.key] ?? ""}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800">
        <strong>Note:</strong> Settings marked with 🔒 require server restart to take effect.
        Settings that override environment variables (API keys, secrets) should be set in your
        <code className="ml-1">.env</code> file, not here.
      </div>
    </div>
  );
}
