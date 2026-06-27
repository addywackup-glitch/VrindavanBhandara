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
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gallery</h1>
          <p className="text-gray-500 text-sm mt-1">{total} images across all categories.</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`?category=${cat}`}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: filterCategory === cat ? "#8B1E1E" : "#F5EEDB",
              color: filterCategory === cat ? "white" : "#5A3E2B",
            }}
          >
            {cat === "ALL" ? "All" : cat.replace(/_/g, " ")}
          </Link>
        ))}
        <Link
          href="?featured=true"
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: params.featured === "true" ? "#B89947" : "#F5EEDB",
            color: params.featured === "true" ? "white" : "#5A3E2B",
          }}
        >
          ⭐ Featured
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
    </div>
  );
}
