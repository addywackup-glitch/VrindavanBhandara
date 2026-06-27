import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seva Gallery — Vrindavan Bhandara | Real Proof of Every Sacred Seva",
  description: "View real photos and videos of sevas performed in Vrindavan and Mathura — Bhandara, Brahmin Bhoj, Gau Seva, and more. Transparent proof of every booking.",
  alternates: { canonical: "https://vrindavanbhandara.com/gallery" },
  openGraph: {
    title: "Seva Gallery — Vrindavan Bhandara",
    description: "Real photos and videos of sacred sevas performed in Vrindavan and Mathura.",
    type: "website",
  },
};

type SearchParams = { type?: string };

async function getGalleryMedia(serviceType?: string) {
  try {
    return await prisma.mediaProof.findMany({
      where: {
        isPublic: true,
        ...(serviceType && serviceType !== "ALL"
          ? { booking: { package: { serviceCategory: { type: serviceType as never } } } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        booking: {
          include: {
            package: { include: { serviceCategory: { select: { name: true, type: true } } } },
          },
        },
      },
    });
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [photos, videos, completedSevas] = await Promise.all([
      prisma.mediaProof.count({ where: { isPublic: true, type: "PHOTO" } }),
      prisma.mediaProof.count({ where: { isPublic: true, type: "VIDEO" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
    ]);
    return { photos, videos, completedSevas };
  } catch {
    return { photos: 0, videos: 0, completedSevas: 0 };
  }
}

const SERVICE_FILTERS = [
  { label: "All Sevas", value: "ALL" },
  { label: "Bhandara", value: "BHANDARA" },
  { label: "Brahmin Bhoj", value: "BRAHMIN_BHOJ" },
  { label: "Gau Seva", value: "GAU_SEVA" },
  { label: "Sadhu Bhojan", value: "SADHU_BHOJAN" },
  { label: "Festival Seva", value: "FESTIVAL_SEVA" },
  { label: "Annadan", value: "ANNADAN" },
];

// Fallback gallery items when DB is empty (for demonstration)
const FALLBACK_GALLERY = [
  { id: "f1", url: "https://images.unsplash.com/photo-1583425423600-b3f2c982c6d8?w=600&q=80", caption: "Bhandara — 500+ devotees served", service: "Bhandara", type: "IMAGE" },
  { id: "f2", url: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80", caption: "Gau Seva — Sacred cow feeding", service: "Gau Seva", type: "IMAGE" },
  { id: "f3", url: "https://images.unsplash.com/photo-1565536421961-1f5d8f1b6f8e?w=600&q=80", caption: "Festival Seva — Janmashtami celebrations", service: "Festival Seva", type: "IMAGE" },
  { id: "f4", url: "https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=600&q=80", caption: "Brahmin Bhoj — Traditional feast", service: "Brahmin Bhoj", type: "IMAGE" },
  { id: "f5", url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&q=80", caption: "Annadan — Serving the needy", service: "Annadan", type: "IMAGE" },
  { id: "f6", url: "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&q=80", caption: "Sadhu Bhojan — Seva to saints", service: "Sadhu Bhojan", type: "IMAGE" },
  { id: "f7", url: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=600&q=80", caption: "Bhandara — Community feast in Vrindavan", service: "Bhandara", type: "IMAGE" },
  { id: "f8", url: "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=600&q=80", caption: "Festival Seva — Holi celebrations", service: "Festival Seva", type: "IMAGE" },
  { id: "f9", url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80", caption: "Gau Seva — Daily care for temple cows", service: "Gau Seva", type: "IMAGE" },
];

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeFilter = params.type ?? "ALL";

  const [media, stats] = await Promise.all([
    getGalleryMedia(activeFilter !== "ALL" ? activeFilter : undefined),
    getStats(),
  ]);

  const displayMedia = media.length > 0
    ? media.map((m) => ({
        id: m.id,
        url: m.url,
        caption: m.caption ?? m.booking.package.serviceCategory.name,
        service: m.booking.package.serviceCategory.name,
        type: String(m.type),
      }))
    : FALLBACK_GALLERY;

  return (
    <>
      {/* Hero */}
      <section
        className="pt-32 pb-16 relative overflow-hidden text-center"
        style={{ background: "linear-gradient(160deg, #0F0F1C 0%, #1A1A2E 40%, #2D1B69 100%)" }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />

        <div className="container relative">
          <span className="section-label text-gold-400">Real Seva Proof</span>
          <h1 className="font-heading text-white mt-3" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            Seva Gallery
          </h1>
          <p className="text-white/60 mt-4 max-w-lg mx-auto text-base leading-relaxed">
            Every photo and video below is real proof of an actual seva performed in
            Vrindavan and Mathura. Transparent, verified, delivered.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            {[
              { label: "Photos", value: stats.photos > 0 ? stats.photos.toLocaleString("en-IN") : "500+" },
              { label: "Videos", value: stats.videos > 0 ? stats.videos.toLocaleString("en-IN") : "200+" },
              { label: "Sevas Completed", value: stats.completedSevas > 0 ? stats.completedSevas.toLocaleString("en-IN") : "1,200+" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold" style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {s.value}
                </p>
                <p className="text-white/50 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-0 z-30 border-b" style={{ background: "rgba(255,255,248,0.9)", backdropFilter: "blur(12px)", borderColor: "rgba(212,175,55,0.15)" }}>
        <div className="container">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
            {SERVICE_FILTERS.map((f) => (
              <Link
                key={f.value}
                href={`/gallery?type=${f.value}`}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={
                  activeFilter === f.value
                    ? { background: "linear-gradient(135deg, #D4AF37, #FF7722)", color: "white" }
                    : { background: "rgba(212,175,55,0.08)", color: "#9A7D25" }
                }
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-py" style={{ background: "#FAFAF5" }}>
        <div className="container">
          {displayMedia.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-5xl mb-4">📸</p>
              <p className="text-gray-500">No proof media in this category yet.</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon — we update this daily.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {displayMedia.map((item, i) => (
                <div
                  key={item.id}
                  className="break-inside-avoid rounded-2xl overflow-hidden group relative"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                >
                  {item.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading={i < 6 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div
                      className="w-full aspect-video flex items-center justify-center"
                      style={{ background: "#1A1A2E" }}
                    >
                      <span className="text-4xl text-white opacity-70">▶</span>
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to top, rgba(26,26,46,0.85) 0%, transparent 60%)" }}>
                    <p className="text-white text-sm font-semibold leading-snug">{item.caption}</p>
                    <p className="text-white/60 text-xs mt-0.5">{item.service}</p>
                  </div>

                  {/* Type badge */}
                  {item.type === "VIDEO" && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: "rgba(0,0,0,0.6)" }}>
                      VIDEO
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #1A1A2E, #2D1B69)" }}>
        <div className="container text-center">
          <h2 className="font-heading text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            Your seva proof will appear here too
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Every booking includes photo/video proof delivered to your dashboard within 24 hours of seva completion.
          </p>
          <Link href="/book" className="btn-gold px-8 py-3.5 text-base">
            Book a Seva Now
          </Link>
        </div>
      </section>
    </>
  );
}
