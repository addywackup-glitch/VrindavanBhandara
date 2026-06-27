"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: "🙏",
    title: "Choose Your Seva",
    description:
      "Browse our sacred seva options — Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, or Festival Seva. Select the one that resonates with your intention.",
  },
  {
    number: "02",
    icon: "📦",
    title: "Select a Package",
    description:
      "Choose from Basic, Standard, Premium, or Maharaj packages. Each package includes specific services performed with full traditional rituals.",
  },
  {
    number: "03",
    icon: "📅",
    title: "Pick Your Date",
    description:
      "Choose an auspicious date for your seva. Our team ensures the seva is performed precisely on your chosen date.",
  },
  {
    number: "04",
    icon: "💳",
    title: "Secure Payment",
    description:
      "Pay securely online via Razorpay — UPI, cards, net banking. Payments are 100% encrypted and protected.",
  },
  {
    number: "05",
    icon: "📸",
    title: "Receive Proof",
    description:
      "After completion, you receive photos and videos of your seva being performed. Full transparency guaranteed.",
  },
  {
    number: "06",
    icon: "📜",
    title: "Get Certificate",
    description:
      "Download your official digital Seva Completion Certificate — a permanent record of your devotion.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section-py bg-white relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-30"
        style={{ background: "var(--gradient-gold)" }}
      />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="section-label">How It Works</span>
          <h2 className="section-title mt-3">
            Book Your Seva in 6 Simple Steps
          </h2>
          <div className="divider-gold mx-auto" />
          <p className="section-subtitle mt-4 max-w-xl mx-auto">
            From selection to proof delivery — the entire seva journey is transparent,
            simple, and fully managed for you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Card */}
              <div className="card-luxury p-7 h-full group relative overflow-hidden">
                {/* Step number watermark — absolute so it never pushes content */}
                <span
                  className="absolute top-4 right-5 font-heading font-bold leading-none select-none pointer-events-none"
                  style={{
                    fontSize: "4rem",
                    background: "var(--gradient-gold)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    opacity: 0.12,
                  }}
                >
                  {step.number}
                </span>

                {/* Icon box — always top-left, consistent height */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,119,34,0.1))",
                    border: "1px solid rgba(212,175,55,0.2)",
                  }}
                >
                  {step.icon}
                </div>

                <h3 className="font-heading text-lg font-bold text-charcoal mb-3 group-hover:text-gold-600 transition-colors">
                  {step.title}
                </h3>

                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Hover accent bottom bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-xl" />
              </div>

              {/* Connector arrow (desktop) */}
              {index < STEPS.length - 1 && (index + 1) % 3 !== 0 && (
                <div className="absolute top-1/2 -right-4 hidden lg:flex items-center z-10">
                  <div className="w-8 h-0.5 bg-gradient-gold" />
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-gold-500" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom trust line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-6 rounded-2xl text-center"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,119,34,0.05))",
            border: "1px solid rgba(212,175,55,0.15)",
          }}
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm text-charcoal/70">
            {[
              "No hidden charges",
              "Seva on exact date",
              "Photos & video proof",
              "Digital certificate",
              "24/7 support",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gold-500" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
