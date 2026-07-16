# Public assets checklist

Drop production-ready files in this folder (`public/`). They are served at the site root (e.g. `public/og-image.jpg` → `/og-image.jpg`).

**Note:** `app/favicon.ico` lives in `app/` (Next.js App Router) and is already tracked separately.

**Placeholders:** Branded placeholder PNG/JPG files are committed for dev and Vercel preview. Replace every file below with final artwork before production launch. Regenerate placeholders: `node scripts/generate-placeholder-assets.mjs`.

---

## Required before production launch

| File | Size | Used by |
|------|------|---------|
| `og-image.jpg` | 1200×630 | Site-wide Open Graph / Twitter (`app/layout.tsx`, `app/page.tsx`) |
| `logo.png` | ~512×512 (square) | JSON-LD Organization schema (`app/layout.tsx`) |
| `icon-16.png` | 16×16 | Browser tab, manifest |
| `icon-32.png` | 32×32 | Browser tab, manifest |
| `apple-icon.png` | 180×180 | iOS home screen |
| `icon-192.png` | 192×192 | PWA manifest, shortcuts |
| `icon-512.png` | 512×512 | PWA manifest, install prompt |

---

## Recommended (SEO / location pages)

| File | Size | Used by |
|------|------|---------|
| `og-vrindavan.jpg` | 1200×630 | `/vrindavan` page metadata |
| `og-mathura.jpg` | 1200×630 | `/mathura` page (add when created) |

---

## Brand guidelines

- Use the Sacred Precision palette: deep green brand, warm accent, clean typography in OG images.
- Keep OG text readable at small preview sizes (Facebook, WhatsApp, Twitter cards).
- Prefer JPG for photos, PNG for icons with transparency.
- Compress before commit (target &lt; 200 KB per OG image, &lt; 50 KB per icon).

---

## Verify after adding files

1. `npm run build` — no broken image references in build output.
2. Open `/manifest.webmanifest` in the browser — icons load without 404.
3. Share a link in WhatsApp/Twitter debugger — OG image appears.
4. Lighthouse PWA audit — installable icons present.

---

## Optional cleanup

Remove this file from production deploys if desired; it is documentation only and safe to delete once assets are in place.
