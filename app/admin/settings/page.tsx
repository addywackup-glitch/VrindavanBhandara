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

const DEFAULT_SETTINGS: Array<{
  key: string;
  label: string;
  type: "string" | "boolean" | "number";
  group: string;
  placeholder?: string;
  readOnly?: boolean;
}> = [
  { key: "site.name", label: "Site Name", type: "string", group: "general", placeholder: "Vrindavan Bhandara" },
  { key: "site.tagline", label: "Tagline", type: "string", group: "general", placeholder: "Sacred Seva, Delivered" },
  { key: "site.maintenanceMode", label: "Maintenance Mode", type: "boolean", group: "general" },
  { key: "brand.logoUrl", label: "Logo URL", type: "string", group: "branding", placeholder: "https://…" },
  { key: "brand.faviconUrl", label: "Favicon URL", type: "string", group: "branding", placeholder: "https://…" },
  { key: "brand.primaryColor", label: "Primary Color", type: "string", group: "branding", placeholder: "#8B1E1E" },
  { key: "payments.razorpayEnabled", label: "Razorpay Enabled", type: "boolean", group: "payments" },
  { key: "payments.razorpayKeyId", label: "Razorpay Key ID (display only — set in .env)", type: "string", group: "payments", readOnly: true, placeholder: "Configured via RAZORPAY_KEY_ID" },
  { key: "payments.taxPercent", label: "Tax Percent (%)", type: "number", group: "payments", placeholder: "0" },
  { key: "payments.minOrderAmount", label: "Min Order Amount (₹)", type: "number", group: "payments", placeholder: "100" },
  { key: "email.fromName", label: "From Name", type: "string", group: "email", placeholder: "Vrindavan Bhandara" },
  { key: "email.fromEmail", label: "From Email", type: "string", group: "email", placeholder: "seva@vrindavanbhandara.com" },
  { key: "email.replyTo", label: "Reply-To Email", type: "string", group: "email", placeholder: "support@vrindavanbhandara.com" },
  { key: "whatsapp.enabled", label: "WhatsApp Notifications Enabled", type: "boolean", group: "whatsapp" },
  { key: "whatsapp.businessName", label: "Business Name", type: "string", group: "whatsapp", placeholder: "Vrindavan Bhandara" },
  { key: "seo.defaultTitle", label: "Default Page Title", type: "string", group: "seo" },
  { key: "seo.defaultDescription", label: "Default Meta Description", type: "string", group: "seo" },
  { key: "seo.ogImage", label: "Default OG Image URL", type: "string", group: "seo" },
  { key: "social.instagram", label: "Instagram URL", type: "string", group: "social" },
  { key: "social.facebook", label: "Facebook URL", type: "string", group: "social" },
  { key: "social.youtube", label: "YouTube URL", type: "string", group: "social" },
  { key: "social.twitter", label: "X / Twitter URL", type: "string", group: "social" },
  { key: "business.phone", label: "Support Phone", type: "string", group: "business", placeholder: "+91 XXXXXXXXXX" },
  { key: "business.email", label: "Support Email", type: "string", group: "business" },
  { key: "business.address", label: "Address", type: "string", group: "business" },
  { key: "legal.privacyUrl", label: "Privacy Policy URL", type: "string", group: "legal" },
  { key: "legal.termsUrl", label: "Terms of Service URL", type: "string", group: "legal" },
  { key: "legal.refundUrl", label: "Refund Policy URL", type: "string", group: "legal" },
  { key: "media.r2BucketUrl", label: "R2 Bucket Base URL", type: "string", group: "media", placeholder: "https://r2.vrindavanbhandara.com" },
  { key: "media.maxFileSizeMb", label: "Max Upload Size (MB)", type: "number", group: "media", placeholder: "50" },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const savedSettings = await prisma.siteConfig.findMany({ orderBy: { group: "asc" } });
  const savedMap = Object.fromEntries(savedSettings.map((s) => [s.key, s.value]));

  const settingsByGroup = DEFAULT_SETTINGS.reduce<Record<string, typeof DEFAULT_SETTINGS>>((acc, setting) => {
    if (!acc[setting.group]) acc[setting.group] = [];
    acc[setting.group].push(setting);
    return acc;
  }, {});

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Settings</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Site configuration. Changes take effect immediately.
          </p>
        </div>
      </div>

      <div className="adm-filter-row" style={{ marginBottom: "1.25rem" }}>
        {Object.entries(SETTING_GROUPS).map(([key, { label, emoji }]) => (
          <a key={key} href={`#group-${key}`} className="adm-filter-btn">
            {emoji} {label}
          </a>
        ))}
      </div>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {Object.entries(settingsByGroup).map(([group, settings]) => {
          const groupMeta = SETTING_GROUPS[group] ?? { label: group, emoji: "⚙️" };
          return (
            <div key={group} id={`group-${group}`} className="adm-detail-card">
              <div className="adm-detail-card-header">{groupMeta.emoji} {groupMeta.label}</div>
              <div className="adm-detail-card-body" style={{ display: "grid", gap: "1rem" }}>
                {settings.map((setting) => (
                  setting.readOnly ? (
                    <div key={setting.key} style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <label className="adm-label" style={{ width: 220, marginBottom: 0 }}>{setting.label}</label>
                      <input className="adm-input" value={setting.placeholder ?? ""} readOnly disabled style={{ opacity: 0.6, flex: 1 }} />
                    </div>
                  ) : (
                    <SettingsClient
                      key={setting.key}
                      settingKey={setting.key}
                      label={setting.label}
                      type={setting.type}
                      placeholder={setting.placeholder}
                      initialValue={savedMap[setting.key] ?? ""}
                    />
                  )
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="adm-alert adm-alert-success" style={{ marginTop: "1.25rem" }}>
        API keys and secrets (Razorpay secret, R2 credentials) must be configured in your <code>.env</code> file, not here.
      </div>
    </>
  );
}
