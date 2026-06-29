"use client";

import { useState } from "react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER ?? "919999999999";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    const text = [
      "Jai Shri Krishna! New enquiry from vrindavanbhandara.com",
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      `Message: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      <div>
        <label htmlFor="contact-name" className="block text-xs font-semibold text-charcoal mb-1.5">Full Name</label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          autoComplete="name"
          placeholder="Your Name"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand text-sm transition-colors"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-xs font-semibold text-charcoal mb-1.5">Email Address</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand text-sm transition-colors"
        />
      </div>
      <div>
        <label htmlFor="contact-phone" className="block text-xs font-semibold text-charcoal mb-1.5">WhatsApp Number</label>
        <input
          id="contact-phone"
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+91 XXXXX XXXXX"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand text-sm transition-colors"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-xs font-semibold text-charcoal mb-1.5">Message</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          placeholder="Tell us about your seva requirements..."
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand text-sm transition-colors resize-none"
        />
      </div>
      {submitted && (
        <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          WhatsApp opened with your message. Send it there to reach our team.
        </p>
      )}
      <button type="submit" className="btn-gold w-full justify-center py-3.5">
        Send via WhatsApp →
      </button>
    </form>
  );
}
