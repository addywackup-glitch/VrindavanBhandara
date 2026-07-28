import type { Metadata } from "next";
import Link from "next/link";
import { getAboutPageContent, getPublicSiteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const [about, site] = await Promise.all([getAboutPageContent(), getPublicSiteConfig()]);
  return {
    title: `About Us — ${site.siteName}`,
    description: about.heroSubtitle,
    alternates: { canonical: "https://vrindavanbhandara.com/about" },
  };
}

export default async function AboutPage() {
  const content = await getAboutPageContent();

  return (
    <>
      <section
        className="pt-32 pb-20 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0F0F1C 0%, #1A1A2E 50%, #2D1B69 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="container max-w-3xl text-center relative">
          <span className="section-label text-gold-400">{content.heroLabel}</span>
          <h1 className="font-heading text-white mt-3" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            {content.heroTitle}
          </h1>
          <p className="text-white/60 mt-5 text-base leading-relaxed">
            {content.heroSubtitle}
          </p>
        </div>
      </section>

      {content.stats.length > 0 && (
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {content.stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="font-heading text-3xl font-bold text-gradient-gold">{value}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-py">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <span className="section-label">{content.storyLabel}</span>
            <h2 className="font-heading text-3xl text-charcoal mt-2">
              {content.storyTitle}
            </h2>
            <div className="divider-gold mx-auto mt-3" />
          </div>

          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-4">
            {content.storyParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {content.pillars.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-5 mt-12">
              {content.pillars.map(({ icon, title, desc }) => (
                <div key={title} className="card-luxury p-6">
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="font-heading text-base font-bold text-charcoal mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-4">{content.ctaText}</p>
            <Link href={content.ctaHref || "/book"} className="btn-gold px-8 py-4 text-base">
              🙏 {content.ctaButton}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
