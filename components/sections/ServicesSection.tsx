"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

type Service = {
  type: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  icon: string;
  price?: string;
  badge?: string;
};

const FALLBACK_SERVICES: Service[] = [
  {
    type: "BHANDARA",
    name: "Bhandara Booking",
    slug: "bhandara",
    description: "Sponsor a large-scale community feast — feeding hundreds or thousands in the holy land of Vrindavan or Mathura.",
    shortDesc: "Community feast for hundreds of devotees",
    icon: "🍱",
    price: "From ₹5,000",
    badge: "Most Popular",
  },
  {
    type: "BRAHMIN_BHOJ",
    name: "Brahmin Bhoj Seva",
    slug: "brahmin-bhoj",
    description: "Perform the sacred Brahmin Bhoj to honour learned priests and earn divine blessings for your family.",
    shortDesc: "Sacred feast for Brahmin priests",
    icon: "🪔",
    price: "From ₹2,100",
  },
  {
    type: "GAU_SEVA",
    name: "Gau Seva",
    slug: "gau-seva",
    description: "Serve the sacred cows of Vrindavan — daily, weekly, or monthly — and receive Lord Krishna's blessings.",
    shortDesc: "Daily, weekly or monthly cow care",
    icon: "🐄",
    price: "From ₹501",
  },
  {
    type: "SADHU_BHOJAN",
    name: "Sadhu Bhojan Seva",
    slug: "sadhu-bhojan",
    description: "Provide meals to ascetic saints and sages who have dedicated their lives to devotion.",
    shortDesc: "Meals for saints and sadhus",
    icon: "🌸",
    price: "From ₹1,100",
  },
  {
    type: "FESTIVAL_SEVA",
    name: "Festival Seva",
    slug: "festival-seva",
    description: "Participate in grand celebrations — Janmashtami, Holi, Radhashtami — and sponsor the festivities.",
    shortDesc: "Special festival campaigns",
    icon: "🎊",
    price: "From ₹1,001",
    badge: "Upcoming: Janmashtami",
  },
  {
    type: "ANNADAN_SEVA",
    name: "Annadan Seva",
    slug: "bhandara",
    description: "The most meritorious act — donating food (anna) to the needy in the holy dhams.",
    shortDesc: "Food donation for the needy",
    icon: "🌾",
    price: "From ₹2,001",
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};


function ServiceCard({ service, index }: { service: Service; index: number }) {
  const isFeatured = service.badge === "Most Popular";

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="relative flex flex-col rounded-2xl overflow-hidden group bg-white"
      style={{
        border: isFeatured
          ? "1px solid rgba(184,153,71,0.5)"
          : "1px solid rgba(184,153,71,0.15)",
        boxShadow: isFeatured
          ? "0 8px 40px rgba(139,30,30,0.08), 0 2px 8px rgba(0,0,0,0.04)"
          : "0 4px 20px rgba(0,0,0,0.03)",
      }}
    >
      {/* Featured background accent */}
      {isFeatured && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ background: "linear-gradient(135deg, #B89947, #8B1E1E)" }}
        />
      )}

      {/* Featured glow */}
      {isFeatured && (
        <div
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(184,153,71,0.1) 0%, transparent 70%)" }}
        />
      )}

      {/* Badge */}
      {service.badge && (
        <div className="absolute top-4 right-4 z-10">
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider"
            style={{
              background: "rgba(139,30,30,0.08)",
              border: "1px solid rgba(139,30,30,0.2)",
              color: "#8B1E1E",
            }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            {service.badge}
          </span>
        </div>
      )}

      <div className="p-7 flex flex-col flex-1 relative z-10">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: "linear-gradient(135deg, rgba(184,153,71,0.1), rgba(139,30,30,0.05))",
            border: "1px solid rgba(184,153,71,0.2)",
          }}
        >
          {service.icon}
        </div>

        {/* Name */}
        <h3
          className="font-heading text-xl font-bold mb-2 transition-colors duration-200"
          style={{ color: isFeatured ? "#8B1E1E" : "#2A2825" }}
        >
          {service.name}
        </h3>

        {/* Desc */}
        <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "#4A453F" }}>
          {service.shortDesc}
        </p>

        {/* Price */}
        {service.price && (
          <p
            className="text-sm font-bold mb-5 font-body"
            style={{
              color: "#8C702E",
            }}
          >
            {service.price}
          </p>
        )}

        {/* CTA */}
        <Link
          href={`/services/${service.slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold group/link mt-auto"
          style={{ color: "#8B1E1E" }}
        >
          <span className="group-hover/link:underline underline-offset-4 transition-all">Book Now</span>
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-transform" />
        </Link>
      </div>

      {/* Bottom accent */}
      <div
        className="h-1 w-0 group-hover:w-full transition-all duration-500 ease-out"
        style={{ background: "linear-gradient(90deg, #B89947, #8B1E1E)" }}
      />
    </motion.div>
  );
}

type ServicesSectionProps = { services?: Service[] };

export function ServicesSection({ services }: ServicesSectionProps) {
  const displayServices = services && services.length > 0 ? services : FALLBACK_SERVICES;

  return (
    <section
      className="section-py relative overflow-hidden"
      style={{ background: "#FFFCF8" }} // Soft white background
    >
      {/* Background accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(184,153,71,0.2), transparent)" }}
      />

      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span
            className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-4 px-4 py-1.5 rounded-full"
            style={{
              color: "#8B1E1E",
              background: "rgba(139,30,30,0.06)",
              border: "1px solid rgba(139,30,30,0.15)",
            }}
          >
            Our Seva Services
          </span>
          <h2
            className="font-heading mb-4"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              color: "#2A2825",
            }}
          >
            Choose Your{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #8B1E1E, #B89947)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Sacred Seva
            </span>
          </h2>
          <div
            className="w-16 h-0.5 mx-auto mb-5"
            style={{ background: "linear-gradient(90deg, #8B1E1E, #B89947)" }}
          />
          <p className="max-w-xl mx-auto text-base leading-relaxed" style={{ color: "#4A453F" }}>
            Every seva is performed with full devotion in the holy land of Vrindavan and Mathura.
            Receive transparent proof with photos and videos.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.map((service, i) => (
            <ServiceCard key={service.type} service={service} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-14"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-xl font-semibold text-sm text-white transition-transform hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #8B1E1E, #B89947)",
              boxShadow: "0 8px 24px rgba(139,30,30,0.25)",
            }}
          >
            View All Services
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(184,153,71,0.2), transparent)" }}
      />
    </section>
  );
}
