"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Tag } from "lucide-react";
import type { BookingFormData } from "@/types";

type PackageItem = { description: string; quantity: number; unit: string };
type Package = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  originalPrice?: number | string | null;
  badge?: string | null;
  maxGuests?: number | null;
  items: PackageItem[];
};

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
};

export function PackageStep({ form, updateForm, onNext }: Props) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!form.serviceType) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setLoading before async fetch is safe; no cascading sync renders
    setLoading(true);
    fetch(`/api/packages?serviceType=${form.serviceType}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPackages(d.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [form.serviceType]);

  const handleSelect = (pkg: Package) => {
    updateForm({
      packageId: pkg.id,
      packageName: pkg.name,
      packagePrice: Number(pkg.price),
      guestCount: pkg.maxGuests ?? 0,
    });
  };

  const formatPrice = (p: number | string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(p));

  return (
    <div>
      <h2 className="font-heading text-2xl text-charcoal mb-1">
        Choose a Package
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        for <span className="font-semibold text-gold-600">{form.serviceName}</span>
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No packages available for this service.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {packages.map((pkg, i) => {
            const isSelected = form.packageId === pkg.id;
            return (
              <motion.button
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => handleSelect(pkg)}
                className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 w-full ${
                  isSelected
                    ? "border-gold-500 bg-gold-50 shadow-luxury"
                    : "border-gray-100 bg-white hover:border-gold-300 hover:shadow-card"
                }`}
              >
                {/* Badge */}
                {pkg.badge && (
                  <div className="absolute -top-3 left-4">
                    <span className="badge badge-saffron text-[10px] px-3 py-1">
                      <Tag className="w-3 h-3 mr-1" />
                      {pkg.badge}
                    </span>
                  </div>
                )}

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-gold flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <h3 className={`font-heading font-bold text-lg ${isSelected ? "text-gold-700" : "text-charcoal"}`}>
                    {pkg.name}
                  </h3>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-gradient-gold">
                    {formatPrice(pkg.price)}
                  </span>
                  {pkg.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(pkg.originalPrice)}
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {pkg.description}
                </p>

                {/* Inclusions */}
                {pkg.items?.length > 0 && (
                  <ul className="space-y-1.5">
                    {pkg.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check className="w-3.5 h-3.5 text-gold-500 flex-shrink-0 mt-0.5" />
                        {item.description}
                        {item.quantity > 1 && (
                          <span className="text-gold-500 font-medium ml-auto">
                            ×{item.quantity} {item.unit}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {form.packageId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center justify-between"
        >
          <div className="text-sm text-gray-600">
            Selected: <span className="font-bold text-charcoal">{form.packageName}</span>
            <span className="ml-2 text-gold-600 font-bold">
              {formatPrice(form.packagePrice)}
            </span>
          </div>
          <button onClick={onNext} className="btn-gold px-8 py-3">
            Select Date →
          </button>
        </motion.div>
      )}
    </div>
  );
}
