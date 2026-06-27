// =============================================================================
// VRINDAVAN BHANDARA — Database Seed
// Seeds: Admin user, service categories, packages, FAQs, seva stats, location pages
// Run: npx prisma db seed
// =============================================================================

import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting database seed...");

  // ===========================================================================
  // 1. Super Admin User
  // ===========================================================================
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@vrindavanbhandara.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@123!";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminUser = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        passwordHash,
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
        "Book a Bhandara in Vrindavan or Mathura online. Feed hundreds of devotees. Transparent proof with photos, videos & digital certificate.",
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
        "Book Brahmin Bhoj Seva in Vrindavan or Mathura. Honour learned priests and earn divine blessings. Digital certificate provided.",
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
        "Sponsor Sadhu Bhojan Seva in Vrindavan. Provide meals for saints and ascetics. Proof photos and certificate provided.",
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
  ];

  for (const cat of serviceCategories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: { ...cat, isActive: true },
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
          { description: "Digital completion certificate", quantity: 1, unit: "certificate" },
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
          { description: "Digital completion certificate", quantity: 1, unit: "certificate" },
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
          { description: "Digital completion certificate", quantity: 1, unit: "certificate" },
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
          { description: "Digital completion certificate", quantity: 1, unit: "certificate" },
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
          { description: "Digital certificate", quantity: 1, unit: "certificate" },
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
          { description: "Digital certificate", quantity: 1, unit: "certificate" },
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
            { packageId: created.id, description: "Digital certificate", quantity: 1, unit: "certificate", sortOrder: 2 },
          ],
        });
      }
    }
    console.log("✅ Seeded Brahmin Bhoj packages");
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
    { key: "certificates_issued", label: "Certificates Issued", value: BigInt(8500), unit: "", icon: "📜", sortOrder: 6 },
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
        "Choose a seva, select a package and date, fill in your details, pay securely online via Razorpay, and receive confirmation. After the seva is performed, you receive photos, videos, and a digital certificate.",
      category: "General",
      sortOrder: 1,
    },
    {
      question: "Do I receive proof that the seva was performed?",
      answer:
        "Yes. Every seva comes with photo proof, and most include video proof. You also receive a digital Seva Completion Certificate that you can download and share.",
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
