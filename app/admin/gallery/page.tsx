import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GalleryClient } from "@/components/admin/GalleryClient";

export const metadata: Metadata = { title: "Gallery" };

type SearchParams = { category?: string; page?: string; featured?: string };

const CATEGORIES = ["ALL", "BHANDARA", "BRAHMIN_BHOJ", "GAU_SEVA", "SADHU_BHOJAN", "FESTIVAL", "TEMPLE", "GENERAL"];

async function getImages({ category, page, featured }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 30;

  const where = {
    ...(category && category !== "ALL" && { category: category as never }),
    ...(featured === "true" && { isFeatured: true }),
  };

  const [images, total] = await Promise.all([
    prisma.galleryImage.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (p - 1) * pageSize,
      take: pageSize,
    }),
    prisma.galleryImage.count({ where }),
  ]);

  return { images, total, page: p, totalPages: Math.ceil(total / pageSize) };
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const filterCategory = params.category ?? "ALL";
  const { images, total, page, totalPages } = await getImages(params);

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Gallery</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {total} images across all categories
          </p>
        </div>
      </div>

      <div className="adm-filter-row" style={{ marginBottom: "1.25rem" }}>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`?category=${cat}`}
            className={`adm-filter-btn${filterCategory === cat ? " active" : ""}`}
          >
            {cat === "ALL" ? "All" : cat.replace(/_/g, " ")}
          </Link>
        ))}
        <Link href="?featured=true" className={`adm-filter-btn${params.featured === "true" ? " active" : ""}`}>
          Featured
        </Link>
      </div>

      <GalleryClient
        images={images.map((img) => ({
          ...img,
          createdAt: img.createdAt.toISOString(),
          updatedAt: img.updatedAt.toISOString(),
        }))}
        page={page}
        totalPages={totalPages}
        filterCategory={filterCategory}
      />
    </>
  );
}
