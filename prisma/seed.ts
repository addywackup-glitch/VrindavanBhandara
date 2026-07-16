// =============================================================================
// VRINDAVAN BHANDARA — Database Seed
// Seeds: Admin user, service categories, packages, FAQs, seva stats, location pages
// Run: npx prisma db seed
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import type { ServicePageSections } from "../lib/validations";

// ===========================================================================
// Presentation-oriented page content per service (ServiceCategory.pageSections)
// Keyed by service slug. Drives fully dynamic service pages — no UI hardcoding.
// ===========================================================================
const SERVICE_PAGE_SECTIONS: Record<string, ServicePageSections> = {
  bhandara: {
    hero: {
      tagline:
        "Feed hundreds of devotees, sadhus, and the needy in the sacred land of Vrindavan.",
      badges: ["100–5,000+ devotees", "Sattvic meals", "Photo & video proof"],
    },
    benefits: [
      { icon: "🍱", title: "Feed the Multitudes", description: "Sponsor a full sattvic feast for hundreds to thousands of devotees and the needy." },
      { icon: "🙏", title: "Immense Spiritual Merit", description: "Annadaan in Vrindavan is regarded as one of the highest acts of devotion." },
      { icon: "📸", title: "Complete Transparency", description: "Receive dated photos and a video highlight of your Bhandara being served." },
    ],
    highlights: [
      { icon: "🪔", title: "Performed on Your Date", description: "Your Bhandara is conducted precisely on the date you choose." },
      { icon: "📿", title: "Sankalp in Your Name", description: "A pujari takes sankalp with your name and gotra before the seva." },
    ],
    howItWorks: [
      { step: 1, title: "Choose a Package", description: "Select a Bhandara size from 100 to 5,000+ devotees.", icon: "📦" },
      { step: 2, title: "Pick Your Date", description: "Choose an auspicious date for the feast.", icon: "📅" },
      { step: 3, title: "Secure Payment", description: "Pay safely online via Razorpay.", icon: "💳" },
      { step: 4, title: "Receive Proof", description: "Get photos and a video of your Bhandara.", icon: "📸" },
    ],
    trustBadges: [
      { icon: "📸", text: "Photo proof of every seva" },
      { icon: "🎥", text: "Video highlight (select packages)" },
      { icon: "🔒", text: "100% secure Razorpay payments" },
    ],
    includedItems: [
      "Freshly cooked sattvic meal",
      "Distribution to devotees, sadhus & the needy",
      "Dated photo documentation",
      "Pujari sankalp with your name & gotra",
    ],
  },
  "brahmin-bhoj": {
    hero: {
      tagline:
        "Honour learned Brahmin priests with a sacred feast and earn blessings for your family and ancestors.",
      badges: ["5–51+ Brahmins", "Full rituals", "Photo & video proof"],
    },
    benefits: [
      { icon: "🪔", title: "Honour the Vedic Tradition", description: "Serve Brahmin priests who preserve the sacred scriptures and rituals." },
      { icon: "🌸", title: "Blessings for Ancestors", description: "Brahmin Bhoj is traditionally performed for the peace of departed souls." },
      { icon: "📸", title: "Verified Seva", description: "Photo and video proof of the bhoj performed in your name." },
    ],
    highlights: [
      { icon: "📿", title: "Complete Rituals", description: "Performed with traditional Vaishnav rites and mantras." },
      { icon: "🙏", title: "Personalised Sankalp", description: "Your name and gotra are recited during the ceremony." },
    ],
    howItWorks: [
      { step: 1, title: "Choose Brahmins", description: "Select from 5 to 51+ Brahmin priests.", icon: "📦" },
      { step: 2, title: "Pick Your Date", description: "Choose the date for the bhoj.", icon: "📅" },
      { step: 3, title: "Secure Payment", description: "Pay safely online via Razorpay.", icon: "💳" },
      { step: 4, title: "Receive Proof", description: "Get photos and video of the seva.", icon: "📸" },
    ],
    trustBadges: [
      { icon: "📸", text: "Photo proof of every seva" },
      { icon: "📿", text: "Authentic Vaishnav rituals" },
      { icon: "🔒", text: "100% secure Razorpay payments" },
    ],
    includedItems: [
      "Full Vaishnav meal for each Brahmin",
      "Traditional rituals & mantras",
      "Dakshina to the priests",
      "Photo & video proof",
    ],
  },
  "gau-seva": {
    hero: {
      tagline:
        "Serve the sacred cows of Vrindavan — beloved of Lord Krishna — with daily, weekly, or monthly care.",
      badges: ["Daily / Weekly / Monthly", "Feed & medical care", "Photo proof"],
    },
    benefits: [
      { icon: "🐄", title: "Care for Sacred Cows", description: "Sponsor feeding, grooming, and medical support for cows in a Vrindavan goshala." },
      { icon: "💚", title: "Krishna's Beloved", description: "Gau Seva is among the dearest forms of devotion to Lord Krishna." },
      { icon: "📸", title: "See Your Impact", description: "Receive photo proof of the cows you have helped care for." },
    ],
    highlights: [
      { icon: "🌾", title: "Wholesome Feed", description: "Green fodder, grains, and jaggery for healthy cows." },
      { icon: "🩺", title: "Medical Support", description: "Veterinary care included for ill and elderly cows." },
    ],
    howItWorks: [
      { step: 1, title: "Choose Duration", description: "Select daily, weekly, or monthly care.", icon: "📦" },
      { step: 2, title: "Confirm Seva", description: "Pick the start date for the care.", icon: "📅" },
      { step: 3, title: "Secure Payment", description: "Pay safely online via Razorpay.", icon: "💳" },
      { step: 4, title: "Receive Proof", description: "Get photos of the cows being cared for.", icon: "📸" },
    ],
    trustBadges: [
      { icon: "📸", text: "Dated photo proof" },
      { icon: "🩺", text: "Veterinary care included" },
      { icon: "🔒", text: "100% secure Razorpay payments" },
    ],
    includedItems: [
      "Daily feed (fodder, grains, jaggery)",
      "Grooming & shelter",
      "Veterinary & medical support",
      "Photo proof of the seva",
    ],
  },
  "vidhwa-seva": {
    hero: {
      tagline:
        "Restore dignity to the widowed mothers of Vrindavan with meals, clothing, and medical care.",
      badges: ["Meals & clothing", "Medical care", "Photo & video proof"],
    },
    benefits: [
      { icon: "🤍", title: "Compassion in Action", description: "Provide nutritious meals and essentials to widowed mothers who have devoted their lives to bhajan." },
      { icon: "🧣", title: "Warmth & Dignity", description: "Sponsor warm clothing and blankets, especially through the harsh winter." },
      { icon: "🩺", title: "Health & Care", description: "Support medicines and basic healthcare for elderly mothers." },
    ],
    highlights: [
      { icon: "🍲", title: "Daily Nourishment", description: "Freshly cooked sattvic meals served with respect." },
      { icon: "🙏", title: "A Life of Devotion", description: "Your seva supports mothers dedicated to Radha-Krishna bhajan." },
    ],
    howItWorks: [
      { step: 1, title: "Choose a Package", description: "Select a one-time or monthly care package.", icon: "📦" },
      { step: 2, title: "Confirm Seva", description: "Pick the date to begin the care.", icon: "📅" },
      { step: 3, title: "Secure Payment", description: "Pay safely online via Razorpay.", icon: "💳" },
      { step: 4, title: "Receive Proof", description: "Get photos and video of the seva.", icon: "📸" },
    ],
    trustBadges: [
      { icon: "📸", text: "Photo & video proof" },
      { icon: "🤍", text: "Direct support to mothers" },
      { icon: "🔒", text: "100% secure Razorpay payments" },
    ],
    includedItems: [
      "Nutritious sattvic meals",
      "Warm clothing & blankets",
      "Medicines & basic healthcare",
      "Photo & video proof",
    ],
  },
};

async function main() {
  console.log("🌱 Starting database seed...");

  // ===========================================================================
  // 1. Super Admin User
  // ===========================================================================
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@vrindavanbhandara.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@123!";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    let supabaseUserId: string | undefined;

    // Prefer creating the admin in Supabase Auth when keys are configured.
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
    ) {
      try {
        const { createAdminClient } = await import("../lib/supabase/admin");
        const { ensureStorageBuckets } = await import("../lib/storage/supabase");
        const adminSb = createAdminClient();
        const { data: created, error } = await adminSb.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { name: "Super Admin", full_name: "Super Admin" },
          app_metadata: { role: "ADMIN" },
        });
        if (error) {
          console.warn("⚠️  Supabase admin auth create:", error.message);
        } else {
          supabaseUserId = created.user?.id;
        }
        await ensureStorageBuckets();
        console.log("✅ Ensured Supabase storage buckets (proofs, gallery, blog)");
      } catch (err) {
        console.warn("⚠️  Supabase auth/storage seed skipped:", err);
      }
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminUser = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        passwordHash,
        supabaseUserId: supabaseUserId ?? null,
        role: "ADMIN",
        isActive: true,
      },
    });

    await prisma.admin.create({
      data: {
        userId: adminUser.id,
        role: "SUPER_ADMIN",
      },
    });

    console.log(`✅ Created admin: ${adminEmail}`);
  } else {
    console.log("⏭️  Admin already exists, skipping.");
  }

  // ===========================================================================
  // 2. Service Categories
  // ===========================================================================
  const serviceCategories = [
    {
      type: "BHANDARA" as const,
      name: "Bhandara Booking",
      slug: "bhandara",
      description:
        "Sponsor a large-scale community feast in the sacred land of Vrindavan or Mathura. A Bhandara feeds hundreds to thousands of devotees, ascetics, and the needy — one of the most meritorious acts of seva.",
      shortDesc: "Large-scale community feast for hundreds of devotees",
      icon: "🍱",
      sortOrder: 1,
      metaTitle: "Bhandara Booking Vrindavan — Book Online | Vrindavan Bhandara",
      metaDesc:
        "Book a Bhandara in Vrindavan or Mathura online. Feed hundreds of devotees. Transparent proof with photos and videos.",
    },
    {
      type: "BRAHMIN_BHOJ" as const,
      name: "Brahmin Bhoj Seva",
      slug: "brahmin-bhoj",
      description:
        "Perform the sacred Brahmin Bhoj to honour learned Brahmin priests and earn divine blessings for yourself, your family, and your ancestors. Brahmins are honoured as representatives of the divine.",
      shortDesc: "Sacred feast for Brahmin priests with full rituals",
      icon: "🪔",
      sortOrder: 2,
      metaTitle: "Brahmin Bhoj Seva — Book Online | Vrindavan Bhandara",
      metaDesc:
        "Book Brahmin Bhoj Seva in Vrindavan or Mathura. Honour learned priests and earn divine blessings. Photo and video proof provided.",
    },
    {
      type: "GAU_SEVA" as const,
      name: "Gau Seva",
      slug: "gau-seva",
      description:
        "Serve the sacred cows of Vrindavan — beloved of Lord Krishna. Daily, weekly, or monthly options to sponsor their care, feeding, and medical support.",
      shortDesc: "Daily, weekly or monthly care for sacred cows",
      icon: "🐄",
      sortOrder: 3,
      metaTitle: "Gau Seva Online — Book in Vrindavan | Vrindavan Bhandara",
      metaDesc:
        "Book Gau Seva online in Vrindavan. Daily, weekly or monthly care for sacred cows beloved of Lord Krishna. Photo proof provided.",
    },
    {
      type: "SADHU_BHOJAN" as const,
      name: "Sadhu Bhojan Seva",
      slug: "sadhu-bhojan",
      description:
        "Provide meals to ascetic saints and sadhus who have dedicated their entire lives to devotion and spiritual practice. Feeding a sadhu is considered equal to feeding Lord Vishnu himself.",
      shortDesc: "Meals for saints and ascetics dedicated to devotion",
      icon: "🌸",
      sortOrder: 4,
      metaTitle: "Sadhu Bhojan Seva — Book Online | Vrindavan Bhandara",
      metaDesc:
        "Sponsor Sadhu Bhojan Seva in Vrindavan. Provide meals for saints and ascetics. Proof photos and videos provided.",
    },
    {
      type: "FESTIVAL_SEVA" as const,
      name: "Festival Seva",
      slug: "festival-seva",
      description:
        "Participate in the grand spiritual celebrations of Vrindavan and Mathura — Janmashtami, Holi, Radhashtami, Govardhan Puja, and more. Sponsor the festivities and receive special blessings.",
      shortDesc: "Special festival campaigns — Janmashtami, Holi, Radhashtami",
      icon: "🎊",
      sortOrder: 5,
      metaTitle: "Festival Seva — Janmashtami, Holi Seva Vrindavan | Vrindavan Bhandara",
      metaDesc:
        "Book Festival Seva for Janmashtami, Holi, Radhashtami in Vrindavan & Mathura. Sponsor the festivities. Photo & video proof provided.",
    },
    {
      type: "ANNADAN_SEVA" as const,
      name: "Annadan Seva",
      slug: "annadan",
      description:
        "Annadan — the donation of food — is considered the highest form of charity in Hindu dharma. Donate food to the needy in the holy dhams of Vrindavan and Mathura.",
      shortDesc: "Food donation for the needy in the holy dhams",
      icon: "🌾",
      sortOrder: 6,
      metaTitle: "Annadan Seva Vrindavan — Online Booking | Vrindavan Bhandara",
      metaDesc:
        "Book Annadan Seva in Vrindavan. Donate food to the needy in the holy dham. Photo proof provided.",
    },
    {
      type: "VIDHWA_SEVA" as const,
      name: "Vidhwa Seva",
      slug: "vidhwa-seva",
      description:
        "Vrindavan is home to thousands of widowed mothers who have devoted their lives to bhajan and seva. Vidhwa Seva provides them with nutritious meals, warm clothing, medicines, and dignity. Your contribution becomes a direct act of compassion for the mothers of the holy dham.",
      shortDesc: "Meals, clothing & care for the widowed mothers of Vrindavan",
      icon: "🤍",
      sortOrder: 7,
      metaTitle: "Vidhwa Seva Vrindavan — Support Widowed Mothers | Vrindavan Bhandara",
      metaDesc:
        "Sponsor Vidhwa Seva in Vrindavan. Provide meals, clothing, and medical care to widowed mothers with transparent photo and video proof.",
    },
  ];

  for (const cat of serviceCategories) {
    const sections = SERVICE_PAGE_SECTIONS[cat.slug];
    const sectionsData = sections
      ? { pageSections: sections as unknown as Prisma.InputJsonValue }
      : {};
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { ...cat, ...sectionsData },
      create: { ...cat, isActive: true, ...sectionsData },
    });
  }
  console.log("✅ Seeded service categories");

  // ===========================================================================
  // 3. Packages — Bhandara
  // ===========================================================================
  const bhandara = await prisma.serviceCategory.findUnique({ where: { slug: "bhandara" } });
  if (bhandara) {
    const bhandaraPackages = [
      {
        name: "Basic Bhandara",
        slug: "bhandara-basic",
        description: "Feed 100 devotees with a nutritious sattvic meal. Includes dal, sabzi, puri, halwa, and chawal.",
        shortDesc: "Feed 100 devotees",
        price: 5000,
        maxGuests: 100,
        sortOrder: 1,
        items: [
          { description: "Sattvic meal (dal, sabzi, puri, halwa, chawal)", quantity: 100, unit: "plates" },
          { description: "Photo proof of seva", quantity: 5, unit: "photos" },
          { description: "Photo & video proof", quantity: 1, unit: "delivery" },
        ],
      },
      {
        name: "Standard Bhandara",
        slug: "bhandara-standard",
        description: "Feed 300 devotees with a full sattvic feast including multiple dishes and mithai.",
        shortDesc: "Feed 300 devotees",
        price: 12000,
        originalPrice: 15000,
        maxGuests: 300,
        badge: "Most Popular",
        isFeatured: true,
        sortOrder: 2,
        items: [
          { description: "Full sattvic feast (5+ dishes, mithai)", quantity: 300, unit: "plates" },
          { description: "Photo proof of seva", quantity: 10, unit: "photos" },
          { description: "Video highlight (30 sec)", quantity: 1, unit: "video" },
          { description: "Photo & video proof", quantity: 1, unit: "delivery" },
        ],
      },
      {
        name: "Premium Bhandara",
        slug: "bhandara-premium",
        description: "Grand feast for 1000 devotees with traditional Vaishnav cuisine, sweets, and full ceremony.",
        shortDesc: "Grand feast for 1,000 devotees",
        price: 35000,
        maxGuests: 1000,
        sortOrder: 3,
        items: [
          { description: "Full Vaishnav feast (7 dishes + sweets)", quantity: 1000, unit: "plates" },
          { description: "Photo proof of seva", quantity: 20, unit: "photos" },
          { description: "Video highlight (2 min)", quantity: 1, unit: "video" },
          { description: "Photo & video proof", quantity: 1, unit: "delivery" },
          { description: "Pujari blessings with your name & gotra", quantity: 1, unit: "blessings" },
        ],
      },
      {
        name: "Maharaj Bhandara",
        slug: "bhandara-maharaj",
        description: "Royal grand feast for 5000+ devotees — the ultimate Bhandara experience with full ceremony, kirtan, and puja.",
        shortDesc: "Royal feast for 5,000+ devotees",
        price: 150000,
        maxGuests: 5000,
        badge: "Best Value",
        sortOrder: 4,
        items: [
          { description: "Royal Vaishnav feast (10+ dishes + sweets)", quantity: 5000, unit: "plates" },
          { description: "Professional photo documentation", quantity: 50, unit: "photos" },
          { description: "Professional video (5 min)", quantity: 1, unit: "video" },
          { description: "Photo & video proof", quantity: 1, unit: "delivery" },
          { description: "Special puja with your name, gotra & sankalp", quantity: 1, unit: "puja" },
          { description: "Kirtan performance during Bhandara", quantity: 1, unit: "session" },
        ],
      },
    ];

    for (const pkg of bhandaraPackages) {
      const { items, ...pkgData } = pkg;
      const existing = await prisma.package.findUnique({ where: { slug: pkg.slug } });
      if (!existing) {
        const created = await prisma.package.create({
          data: {
            ...pkgData,
            serviceCategoryId: bhandara.id,
            isActive: true,
          },
        });
        for (let i = 0; i < items.length; i++) {
          await prisma.packageItem.create({
            data: { ...items[i], packageId: created.id, sortOrder: i },
          });
        }
      }
    }
    console.log("✅ Seeded Bhandara packages");
  }

  // ===========================================================================
  // 4. Gau Seva Packages
  // ===========================================================================
  const gauSeva = await prisma.serviceCategory.findUnique({ where: { slug: "gau-seva" } });
  if (gauSeva) {
    const gauPackages = [
      {
        name: "Daily Gau Seva",
        slug: "gau-seva-daily",
        description: "Sponsor one day of complete care for sacred cows — feeding, grooming, and medical support.",
        shortDesc: "One day of sacred cow care",
        price: 501,
        sortOrder: 1,
        items: [
          { description: "Feed 10 sacred cows for one day", quantity: 10, unit: "cows" },
          { description: "Photo proof with date", quantity: 3, unit: "photos" },
        ],
      },
      {
        name: "Weekly Gau Seva",
        slug: "gau-seva-weekly",
        description: "Sponsor a full week of sacred cow care — feeding, grooming, and medical support for 7 days.",
        shortDesc: "One week of sacred cow care",
        price: 2100,
        originalPrice: 3507,
        badge: "Save 40%",
        isFeatured: true,
        sortOrder: 2,
        items: [
          { description: "Feed 10 sacred cows for 7 days", quantity: 10, unit: "cows" },
          { description: "Weekly photo proof album", quantity: 7, unit: "photos" },
          { description: "Photo & video proof", quantity: 1, unit: "delivery" },
        ],
      },
      {
        name: "Monthly Gau Seva",
        slug: "gau-seva-monthly",
        description: "Sponsor a full month of comprehensive sacred cow care in Vrindavan.",
        shortDesc: "One month of sacred cow care",
        price: 7500,
        originalPrice: 15510,
        badge: "Best Value",
        sortOrder: 3,
        items: [
          { description: "Feed 10 sacred cows for 30 days", quantity: 10, unit: "cows" },
          { description: "Monthly photo album (30 photos)", quantity: 30, unit: "photos" },
          { description: "Monthly progress video", quantity: 1, unit: "video" },
          { description: "Photo & video proof", quantity: 1, unit: "delivery" },
        ],
      },
    ];

    for (const pkg of gauPackages) {
      const { items, ...pkgData } = pkg;
      const existing = await prisma.package.findUnique({ where: { slug: pkg.slug } });
      if (!existing) {
        const created = await prisma.package.create({
          data: { ...pkgData, serviceCategoryId: gauSeva.id, isActive: true },
        });
        for (let i = 0; i < items.length; i++) {
          await prisma.packageItem.create({
            data: { ...items[i], packageId: created.id, sortOrder: i },
          });
        }
      }
    }
    console.log("✅ Seeded Gau Seva packages");
  }

  // ===========================================================================
  // 5. Brahmin Bhoj Packages
  // ===========================================================================
  const brahminBhoj = await prisma.serviceCategory.findUnique({ where: { slug: "brahmin-bhoj" } });
  if (brahminBhoj) {
    const brahminPackages = [
      { slug: "brahmin-5", name: "5 Brahmins", price: 2100, guests: 5 },
      { slug: "brahmin-11", name: "11 Brahmins", price: 4500, guests: 11, isFeatured: true },
      { slug: "brahmin-21", name: "21 Brahmins", price: 8500, guests: 21 },
      { slug: "brahmin-51", name: "51 Brahmins", price: 18000, guests: 51 },
    ];

    for (const pkg of brahminPackages) {
      const existing = await prisma.package.findUnique({ where: { slug: pkg.slug } });
      if (!existing) {
        const created = await prisma.package.create({
          data: {
            name: pkg.name,
            slug: pkg.slug,
            description: `Perform Brahmin Bhoj for ${pkg.guests} Brahmin priests with full Vaishnav cuisine and rituals.`,
            shortDesc: `Feast for ${pkg.guests} Brahmin priests`,
            price: pkg.price,
            maxGuests: pkg.guests,
            serviceCategoryId: brahminBhoj.id,
            isActive: true,
            isFeatured: pkg.isFeatured ?? false,
            sortOrder: brahminPackages.indexOf(pkg) + 1,
          },
        });
        await prisma.packageItem.createMany({
          data: [
            { packageId: created.id, description: `Full Vaishnav meal for ${pkg.guests} Brahmins`, quantity: pkg.guests, unit: "plates", sortOrder: 0 },
            { packageId: created.id, description: "Photo proof of seva", quantity: 5, unit: "photos", sortOrder: 1 },
            { packageId: created.id, description: "Photo & video proof", quantity: 1, unit: "delivery", sortOrder: 2 },
          ],
        });
      }
    }
    console.log("✅ Seeded Brahmin Bhoj packages");
  }

  // ===========================================================================
  // 5b. Vidhwa Seva Packages
  // ===========================================================================
  const vidhwaSeva = await prisma.serviceCategory.findUnique({ where: { slug: "vidhwa-seva" } });
  if (vidhwaSeva) {
    const vidhwaPackages = [
      {
        name: "Meal Seva — One Day",
        slug: "vidhwa-meal-day",
        description: "Provide a full day of nutritious sattvic meals to widowed mothers in a Vrindavan ashram.",
        shortDesc: "One day of meals for the mothers",
        price: 1100,
        sortOrder: 1,
        items: [
          { description: "Sattvic meals for widowed mothers (one day)", quantity: 50, unit: "meals" },
          { description: "Dated photo proof", quantity: 5, unit: "photos" },
        ],
      },
      {
        name: "Care Package — Monthly",
        slug: "vidhwa-care-monthly",
        description: "Sponsor a month of meals plus essentials — clothing, toiletries, and basic medicines — for widowed mothers.",
        shortDesc: "A month of meals & essentials",
        price: 5100,
        originalPrice: 6500,
        badge: "Most Popular",
        isFeatured: true,
        sortOrder: 2,
        items: [
          { description: "Daily sattvic meals for one month", quantity: 30, unit: "days" },
          { description: "Clothing & toiletries kit", quantity: 1, unit: "kit" },
          { description: "Basic medicines", quantity: 1, unit: "set" },
          { description: "Photo & video proof", quantity: 1, unit: "delivery" },
        ],
      },
      {
        name: "Winter Relief Seva",
        slug: "vidhwa-winter-relief",
        description: "Provide warm blankets, woollens, and nourishing meals to widowed mothers through the harsh Vrindavan winter.",
        shortDesc: "Warm clothing & meals for winter",
        price: 11000,
        sortOrder: 3,
        items: [
          { description: "Warm blankets & woollens", quantity: 25, unit: "kits" },
          { description: "Nourishing winter meals", quantity: 25, unit: "mothers" },
          { description: "Photo & video proof", quantity: 1, unit: "delivery" },
        ],
      },
    ];

    for (const pkg of vidhwaPackages) {
      const { items, ...pkgData } = pkg;
      const existing = await prisma.package.findUnique({ where: { slug: pkg.slug } });
      if (!existing) {
        const created = await prisma.package.create({
          data: { ...pkgData, serviceCategoryId: vidhwaSeva.id, isActive: true },
        });
        for (let i = 0; i < items.length; i++) {
          await prisma.packageItem.create({
            data: { ...items[i], packageId: created.id, sortOrder: i },
          });
        }
      }
    }
    console.log("✅ Seeded Vidhwa Seva packages");
  }

  // ===========================================================================
  // 6. Seva Statistics
  // ===========================================================================
  const sevaStats = [
    { key: "meals_served", label: "Meals Served", value: BigInt(250000), unit: "Meals", icon: "🍱", sortOrder: 1 },
    { key: "bhandaras_completed", label: "Bhandaras Completed", value: BigInt(1200), unit: "", icon: "🪔", sortOrder: 2 },
    { key: "devotees_served", label: "Devotees Served", value: BigInt(10000), unit: "", icon: "🙏", sortOrder: 3 },
    { key: "countries_reached", label: "Countries Reached", value: BigInt(52), unit: "", icon: "🌍", sortOrder: 4 },
    { key: "gau_sevas", label: "Gau Sevas Performed", value: BigInt(3600), unit: "", icon: "🐄", sortOrder: 5 },
    { key: "proofs_delivered", label: "Proofs Delivered", value: BigInt(8500), unit: "", icon: "📸", sortOrder: 6 },
  ];


  for (const stat of sevaStats) {
    await prisma.sevaStatistic.upsert({
      where: { key: stat.key },
      update: stat,
      create: { ...stat, isVisible: true },
    });
  }
  console.log("✅ Seeded seva statistics");

  // ===========================================================================
  // 7. FAQs
  // ===========================================================================
  const faqs = [
    {
      question: "How does the booking process work?",
      answer:
        "Choose a seva, select a package and date, fill in your details, pay securely online via Razorpay, and receive confirmation. After the seva is performed, you receive photos and videos as proof.",
      category: "General",
      sortOrder: 1,
    },
    {
      question: "Do I receive proof that the seva was performed?",
      answer:
        "Yes. Every seva comes with photo proof, and most include video proof. You can view and download them from your dashboard.",
      category: "General",
      sortOrder: 2,
    },
    {
      question: "Is my payment secure?",
      answer:
        "Yes. All payments are processed through Razorpay — a PCI-DSS compliant payment gateway. Your card or UPI details are never stored on our servers.",
      category: "Payments",
      sortOrder: 3,
    },
    {
      question: "What is the refund policy?",
      answer:
        "If the seva cannot be performed on your selected date, we will reschedule or issue a full refund. Please refer to our Refund Policy page for details.",
      category: "Payments",
      sortOrder: 4,
    },
    {
      question: "Can I book a custom package?",
      answer:
        "Yes! We support custom packages for large groups. Please contact us via WhatsApp or email for a custom quote.",
      category: "Booking",
      sortOrder: 5,
    },
    {
      question: "How far in advance should I book?",
      answer:
        "We recommend booking at least 2-3 days in advance. For festival sevas (Janmashtami, Holi, Radhashtami), book 1-2 weeks early as slots fill up quickly.",
      category: "Booking",
      sortOrder: 6,
    },
    {
      question: "Can NRIs (Non-Resident Indians) book sevas?",
      answer:
        "Absolutely! We serve devotees from over 50 countries. International cards and PayPal are accepted. Proof is delivered digitally so you receive it instantly wherever you are.",
      category: "General",
      sortOrder: 7,
    },
    // --- Service-scoped FAQs (shown on the matching service page) ------------
    {
      question: "How many devotees can a Bhandara feed?",
      answer:
        "Our Bhandara packages range from 100 devotees (Basic) to 5,000+ devotees (Maharaj). You can also request a custom size for very large feasts.",
      category: "Bhandara",
      serviceType: "BHANDARA" as const,
      sortOrder: 1,
    },
    {
      question: "What food is served at a Bhandara?",
      answer:
        "A freshly cooked sattvic meal — typically dal, sabzi, puri, rice, and halwa. Premium packages include multiple dishes and mithai prepared in the Vaishnav tradition.",
      category: "Bhandara",
      serviceType: "BHANDARA" as const,
      sortOrder: 2,
    },
    {
      question: "Are the Brahmins genuine Vedic priests?",
      answer:
        "Yes. Brahmin Bhoj is performed for learned Brahmin priests of Vrindavan who conduct the rituals with authentic Vaishnav rites and recite your sankalp.",
      category: "Brahmin Bhoj",
      serviceType: "BRAHMIN_BHOJ" as const,
      sortOrder: 1,
    },
    {
      question: "Can I perform Brahmin Bhoj for my ancestors?",
      answer:
        "Yes. Many devotees sponsor Brahmin Bhoj for the peace of departed family members. Your name and gotra are recited during the ceremony.",
      category: "Brahmin Bhoj",
      serviceType: "BRAHMIN_BHOJ" as const,
      sortOrder: 2,
    },
    {
      question: "How are the cows cared for in Gau Seva?",
      answer:
        "Sponsored cows receive green fodder, grains, and jaggery, along with grooming, shelter, and veterinary care in a Vrindavan goshala.",
      category: "Gau Seva",
      serviceType: "GAU_SEVA" as const,
      sortOrder: 1,
    },
    {
      question: "Can I sponsor Gau Seva every month?",
      answer:
        "Yes. Choose the Monthly Gau Seva package for ongoing care. We are also adding recurring subscriptions for effortless monthly seva.",
      category: "Gau Seva",
      serviceType: "GAU_SEVA" as const,
      sortOrder: 2,
    },
    {
      question: "Who benefits from Vidhwa Seva?",
      answer:
        "Vidhwa Seva supports the widowed mothers of Vrindavan — many of whom have devoted their lives to Radha-Krishna bhajan — with meals, clothing, and medical care.",
      category: "Vidhwa Seva",
      serviceType: "VIDHWA_SEVA" as const,
      sortOrder: 1,
    },
    {
      question: "What does the Vidhwa Seva care package include?",
      answer:
        "The monthly care package provides daily sattvic meals, a clothing and toiletries kit, and basic medicines, with photo and video proof of the seva.",
      category: "Vidhwa Seva",
      serviceType: "VIDHWA_SEVA" as const,
      sortOrder: 2,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({
      where: { question: faq.question },
    });
    if (!existing) {
      await prisma.fAQ.create({ data: { ...faq, isActive: true } });
    }
  }
  console.log("✅ Seeded FAQs");

  // ===========================================================================
  // 8. Location Pages
  // ===========================================================================
  await prisma.locationPage.upsert({
    where: { region: "VRINDAVAN" },
    update: {},
    create: {
      region: "VRINDAVAN",
      name: "Vrindavan",
      slug: "vrindavan",
      heroTitle: "Book Sacred Seva in Vrindavan",
      heroSubtitle: "The divine home of Lord Krishna",
      description:
        "Vrindavan is one of the holiest cities in Hinduism, the sacred land where Lord Krishna spent his childhood.",
      content: "Vrindavan content...",
      keywords: ["Bhandara Booking Vrindavan", "online seva Vrindavan", "Annadan Seva Vrindavan"],
      address: "Vrindavan, Mathura, Uttar Pradesh — 281121",
      latitude: 27.5736,
      longitude: 77.6880,
      isActive: true,
    },
  });

  await prisma.locationPage.upsert({
    where: { region: "MATHURA" },
    update: {},
    create: {
      region: "MATHURA",
      name: "Mathura",
      slug: "mathura",
      heroTitle: "Book Sacred Seva in Mathura",
      heroSubtitle: "Birthplace of Lord Krishna",
      description:
        "Mathura is one of the seven sacred cities (Sapta Puri) of Hinduism and the birthplace of Lord Sri Krishna.",
      content: "Mathura content...",
      keywords: ["Bhandara Booking Mathura", "Janmashtami Seva Mathura", "online seva Mathura"],
      address: "Mathura, Uttar Pradesh — 281001",
      latitude: 27.4924,
      longitude: 77.6737,
      isActive: true,
    },
  });
  console.log("✅ Seeded location pages");

  // ===========================================================================
  // 9. Testimonials (service-scoped, approved & featured)
  // ===========================================================================
  const testimonials = [
    {
      name: "Ramesh Kumar",
      city: "Delhi",
      country: "India",
      rating: 5,
      comment:
        "I sponsored a Bhandara for my mother's anniversary. Within hours I received photos of hundreds of devotees being served. Deeply moving and completely transparent.",
      serviceType: "BHANDARA" as const,
      isFeatured: true,
    },
    {
      name: "Anita Sharma",
      city: "Mumbai",
      country: "India",
      rating: 5,
      comment:
        "The Brahmin Bhoj was performed for my late father with full rituals and our gotra. The video brought our whole family to tears. Thank you.",
      serviceType: "BRAHMIN_BHOJ" as const,
      isFeatured: true,
    },
    {
      name: "Vikram Patel",
      city: "London",
      country: "United Kingdom",
      rating: 5,
      comment:
        "Being abroad, I always wanted to do Gau Seva in Vrindavan. The monthly photos of the cows I help feed are the highlight of my month.",
      serviceType: "GAU_SEVA" as const,
      isFeatured: true,
    },
    {
      name: "Sunita Devi",
      city: "Jaipur",
      country: "India",
      rating: 5,
      comment:
        "The Vidhwa Seva care package touched my heart. Knowing the widowed mothers received warm meals and clothing in my parents' name means everything.",
      serviceType: "VIDHWA_SEVA" as const,
      isFeatured: true,
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { name: t.name, serviceType: t.serviceType },
    });
    if (!existing) {
      await prisma.testimonial.create({ data: { ...t, isApproved: true } });
    }
  }
  console.log("✅ Seeded testimonials");

  // ===========================================================================
  // 10. Gallery Images (service-scoped, public) — requires an admin uploader
  // ===========================================================================
  const uploader = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (uploader) {
    const galleryImages = [
      {
        title: "Bhandara feast in progress",
        url: "https://images.vrindavanbhandara.com/seed/bhandara-1.jpg",
        category: "BHANDARA" as const,
        serviceType: "BHANDARA" as const,
        location: "Vrindavan",
        isFeatured: true,
        sortOrder: 1,
      },
      {
        title: "Devotees served at Bhandara",
        url: "https://images.vrindavanbhandara.com/seed/bhandara-2.jpg",
        category: "BHANDARA" as const,
        serviceType: "BHANDARA" as const,
        location: "Vrindavan",
        sortOrder: 2,
      },
      {
        title: "Brahmin Bhoj ceremony",
        url: "https://images.vrindavanbhandara.com/seed/brahmin-bhoj-1.jpg",
        category: "BRAHMIN_BHOJ" as const,
        serviceType: "BRAHMIN_BHOJ" as const,
        location: "Vrindavan",
        isFeatured: true,
        sortOrder: 1,
      },
      {
        title: "Sacred cows at the goshala",
        url: "https://images.vrindavanbhandara.com/seed/gau-seva-1.jpg",
        category: "GAU_SEVA" as const,
        serviceType: "GAU_SEVA" as const,
        location: "Vrindavan",
        isFeatured: true,
        sortOrder: 1,
      },
      {
        title: "Vidhwa mothers receiving meals",
        url: "https://images.vrindavanbhandara.com/seed/vidhwa-seva-1.jpg",
        category: "GENERAL" as const,
        serviceType: "VIDHWA_SEVA" as const,
        location: "Vrindavan",
        isFeatured: true,
        sortOrder: 1,
      },
    ];

    for (const img of galleryImages) {
      const existing = await prisma.galleryImage.findFirst({ where: { url: img.url } });
      if (!existing) {
        await prisma.galleryImage.create({
          data: { ...img, isActive: true, uploadedBy: uploader.id, tags: [] },
        });
      }
    }
    console.log("✅ Seeded gallery images");
  }

  console.log("🎉 Database seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
