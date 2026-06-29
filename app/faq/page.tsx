"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Loader2 } from "lucide-react";

type FAQ = { id: string; question: string; answer: string; category: string };

const FALLBACK_FAQS: FAQ[] = [
  { id: "1", category: "General", question: "How does the booking process work?", answer: "Choose a seva, select a package and date, fill in your details, and pay securely via Razorpay. After the seva is performed, you receive photos and videos as proof." },
  { id: "2", category: "General", question: "Do I receive proof that the seva was performed?", answer: "Yes. Every seva comes with photo proof, and most include video proof. You can view and download them from your dashboard." },
  { id: "3", category: "Payments", question: "Is my payment secure?", answer: "Yes. All payments are processed through Razorpay — a PCI-DSS compliant payment gateway. Your card or UPI details are never stored on our servers." },
  { id: "4", category: "Payments", question: "What is the refund policy?", answer: "If the seva cannot be performed on your selected date, we will reschedule or issue a full refund within 5-7 working days." },
  { id: "5", category: "Booking", question: "How far in advance should I book?", answer: "We recommend booking at least 2-3 days in advance. For festival sevas (Janmashtami, Holi, Radhashtami), book 1-2 weeks early as slots fill quickly." },
  { id: "6", category: "Booking", question: "Can I book a custom package?", answer: "Yes! We support custom packages for large groups or specific requirements. Contact us via WhatsApp or email for a custom quote." },
  { id: "7", category: "General", question: "Can NRIs book sevas?", answer: "Absolutely! We serve devotees from 50+ countries. International cards are accepted and proof is delivered digitally, so you receive it wherever you are." },
];

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetch("/api/faqs")
      .then((r) => r.json())
      .then((d) => setFaqs(d.success && d.data.length > 0 ? d.data : FALLBACK_FAQS))
      .catch(() => setFaqs(FALLBACK_FAQS))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filtered = faqs.filter((f) => {
    const matchCat = activeCategory === "All" || f.category === activeCategory;
    const matchSearch =
      !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = filtered.reduce<Record<string, FAQ[]>>((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <>
      {/* Hero */}
      <section
        className="pt-32 pb-16 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0F0F1C 0%, #1A1A2E 50%, #2D1B69 100%)" }}
      >
        <div className="container">
          <span className="section-label text-gold-400">Got Questions?</span>
          <h1 className="font-heading text-white mt-3" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Frequently Asked Questions
          </h1>
          <p className="text-white/60 mt-3 max-w-lg mx-auto text-sm">
            Everything you need to know about booking your sacred seva with Vrindavan Bhandara.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-gold-400 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section-py" style={{ background: "#F5EEDB" }}>
        <div className="container max-w-3xl">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-gradient-gold text-white shadow-glow-gold"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gold-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No matching questions found.</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="font-heading text-lg font-bold text-charcoal mb-4 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-gold flex items-center justify-center text-white text-[10px] font-bold">
                      {items.length}
                    </span>
                    {category}
                  </h2>
                  <div className="space-y-3">
                    {items.map((faq) => (
                      <motion.div
                        key={faq.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card-luxury overflow-hidden"
                      >
                        <button
                          onClick={() => setOpen(open === faq.id ? null : faq.id)}
                          className="w-full flex items-center justify-between p-5 text-left hover:bg-gold-50/50 transition-colors"
                        >
                          <span className="font-semibold text-charcoal text-sm pr-4">{faq.question}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-gold-500 flex-shrink-0 transition-transform ${
                              open === faq.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {open === faq.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div
            className="mt-12 p-6 rounded-2xl text-center"
            style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}
          >
            <p className="text-charcoal font-semibold mb-2">Still have questions?</p>
            <p className="text-gray-500 text-sm mb-4">
              Our team is available on WhatsApp 7 days a week.
            </p>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold px-6 py-3 inline-flex"
            >
              💬 Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
