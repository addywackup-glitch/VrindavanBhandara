"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  rating: number;
  comment: string;
  serviceType?: string | null;
};

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Priya Sharma",
    city: "Mumbai",
    country: "India",
    rating: 5,
    comment:
      "Absolutely divine experience. I booked a Bhandara for my mother's anniversary and received photos within hours. The proof was detailed and beautiful. Highly recommended!",
    serviceType: "Bhandara Booking",
  },
  {
    id: "2",
    name: "Rajesh Kumar",
    city: "New Jersey",
    country: "USA",
    rating: 5,
    comment:
      "As an NRI, I always wanted to do Gau Seva in Vrindavan. This platform made it so easy. The proof photos and video they shared gave me immense peace of mind.",
    serviceType: "Gau Seva",
  },
  {
    id: "3",
    name: "Ananya Patel",
    city: "London",
    country: "UK",
    rating: 5,
    comment:
      "Booked Brahmin Bhoj for my father's shraddh. The team was professional, the photos were heartwarming. Will definitely book again for Janmashtami.",
    serviceType: "Brahmin Bhoj Seva",
  },
  {
    id: "4",
    name: "Suresh Agarwal",
    city: "Dubai",
    country: "UAE",
    rating: 5,
    comment:
      "I was skeptical at first but after receiving real-time photos, I was moved to tears. This is a genuine service that truly serves. Jai Shri Krishna!",
    serviceType: "Festival Seva",
  },
  {
    id: "5",
    name: "Meera Joshi",
    city: "Bangalore",
    country: "India",
    rating: 5,
    comment:
      "The platform is beautiful and easy to use. Payment was secure, and I received photo proof within 2 hours of completion. Outstanding service!",
    serviceType: "Bhandara Booking",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-gold-500 fill-gold-500" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="card-luxury p-7 flex flex-col gap-4 h-full"
    >
      {/* Quote icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,119,34,0.1))",
        }}
      >
        <Quote className="w-5 h-5 text-gold-500" />
      </div>

      {/* Comment */}
      <p className="text-gray-600 text-sm leading-relaxed flex-1 italic">
        &ldquo;{testimonial.comment}&rdquo;
      </p>

      {/* Rating */}
      <StarRating rating={testimonial.rating} />

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-gold-100/50">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: "var(--gradient-gold)" }}
        >
          {testimonial.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-charcoal text-sm">{testimonial.name}</p>
          <p className="text-gray-400 text-xs">
            {testimonial.city && testimonial.country
              ? `${testimonial.city}, ${testimonial.country}`
              : testimonial.country ?? ""}
            {testimonial.serviceType && (
              <span className="ml-2 text-gold-500">· {testimonial.serviceType}</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

type TestimonialsSectionProps = {
  testimonials?: Testimonial[];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const displayTestimonials =
    testimonials && testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;

  return (
    <section
      className="section-py relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #1A1A2E 0%, #2D1B69 60%, #1A1A2E 100%)",
      }}
    >
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)" }}
        />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="section-label">Testimonials</span>
          <h2 className="font-heading text-white mt-3 text-3xl md:text-4xl">
            What Devotees Say
          </h2>
          <div className="divider-gold mx-auto mt-4" />
          <p className="text-white/60 mt-4 max-w-xl mx-auto">
            Real experiences from devotees across India and the world.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTestimonials.slice(0, 6).map((testimonial, i) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={i}
            />
          ))}
        </div>

        {/* Overall rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-gold-400 fill-gold-400" />
            ))}
          </div>
          <p className="text-white/60 text-sm">
            <span className="text-gold-400 font-bold text-lg">4.9/5</span> rating from
            over <span className="text-white font-semibold">2,500+ reviews</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
