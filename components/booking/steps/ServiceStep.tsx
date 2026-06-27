"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import type { BookingFormData } from "@/types";

type ServiceCategory = {
  id: string;
  type: string;
  name: string;
  slug: string;
  shortDesc: string;
  icon: string | null;
};

const FALLBACK_SERVICES: ServiceCategory[] = [
  { id: "bhandara", type: "BHANDARA", name: "Bhandara Booking", slug: "bhandara", shortDesc: "Large-scale community feast for hundreds of devotees", icon: "🍱" },
  { id: "brahmin-bhoj", type: "BRAHMIN_BHOJ", name: "Brahmin Bhoj Seva", slug: "brahmin-bhoj", shortDesc: "Sacred feast for Brahmin priests", icon: "🪔" },
  { id: "gau-seva", type: "GAU_SEVA", name: "Gau Seva", slug: "gau-seva", shortDesc: "Daily, weekly or monthly care for sacred cows", icon: "🐄" },
  { id: "sadhu-bhojan", type: "SADHU_BHOJAN", name: "Sadhu Bhojan Seva", slug: "sadhu-bhojan", shortDesc: "Meals for saints and ascetics", icon: "🌸" },
  { id: "festival-seva", type: "FESTIVAL_SEVA", name: "Festival Seva", slug: "festival-seva", shortDesc: "Janmashtami, Holi, Radhashtami & more", icon: "🎊" },
  { id: "annadan-seva", type: "ANNADAN_SEVA", name: "Annadan Seva", slug: "annadan", shortDesc: "Food donation for the needy in the holy dhams", icon: "🌾" },
];

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
};

export function ServiceStep({ form, updateForm, onNext }: Props) {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length > 0) {
          setServices(d.data);
        } else {
          setServices(FALLBACK_SERVICES);
        }
      })
      .catch(() => setServices(FALLBACK_SERVICES))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (service: ServiceCategory) => {
    updateForm({
      serviceCategoryId: service.id,
      serviceType: service.type,
      serviceName: service.name,
      packageId: "",
      packageName: "",
      packagePrice: 0,
    });
  };

  return (
    <div>
      <h2 className="font-heading text-2xl text-charcoal mb-2">Choose Your Seva</h2>
      <p className="text-gray-500 text-sm mb-8">
        Select the type of sacred seva you wish to sponsor in Vrindavan or Mathura.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, i) => {
            const isSelected = form.serviceCategoryId === service.id;
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleSelect(service)}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
                  isSelected
                    ? "border-gold-500 bg-gold-50 shadow-luxury"
                    : "border-gray-100 bg-white hover:border-gold-300 hover:shadow-card"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110"
                  style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,119,34,0.1))" }}
                >
                  {service.icon ?? "🙏"}
                </div>
                <h3 className={`font-heading font-bold text-base mb-1 ${isSelected ? "text-gold-700" : "text-charcoal"}`}>
                  {service.name}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">{service.shortDesc}</p>
              </motion.button>
            );
          })}
        </div>
      )}

      {form.serviceCategoryId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex justify-end"
        >
          <button onClick={onNext} className="btn-gold px-8 py-3">
            Continue to Packages
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
