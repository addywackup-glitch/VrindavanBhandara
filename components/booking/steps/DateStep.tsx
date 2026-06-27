"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Info } from "lucide-react";
import type { BookingFormData } from "@/types";

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
};

const AUSPICIOUS_NOTES: Record<string, string> = {
  MONDAY: "Dedicated to Lord Shiva — auspicious for seva",
  THURSDAY: "Guru Vaar — extremely auspicious for Brahmin Bhoj",
  SATURDAY: "Shani Vaar — powerful for Annadan",
  SUNDAY: "Ravi Vaar — auspicious for Gau Seva",
};

export function DateStep({ form, updateForm }: Props) {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split("T")[0];

  const [selectedDay, setSelectedDay] = useState<string>("");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateForm({ sevaDate: val });
    const day = new Date(val).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    setSelectedDay(day);
  };

  const auspiciousNote = AUSPICIOUS_NOTES[selectedDay];

  return (
    <div>
      <h2 className="font-heading text-2xl text-charcoal mb-2">Choose Your Seva Date</h2>
      <p className="text-gray-500 text-sm mb-8">
        Select an auspicious date. Booking must be at least 2 days in advance.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Date Picker */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-3">
            Seva Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="seva-date"
            value={form.sevaDate}
            min={minDateStr}
            onChange={handleDateChange}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none transition-colors text-charcoal font-body text-sm"
          />
          {form.sevaDate && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-lg bg-gold-50 border border-gold-200"
            >
              <p className="text-xs text-gold-700 font-medium">
                📅 Seva scheduled for:{" "}
                {new Date(form.sevaDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {auspiciousNote && (
                <p className="text-xs text-saffron-600 mt-1.5 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  {auspiciousNote}
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Location Selector */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-3">
            Seva Location <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {[
              { value: "VRINDAVAN", label: "Vrindavan", desc: "Sacred home of Lord Krishna", icon: "🪔" },
              { value: "MATHURA", label: "Mathura", desc: "Birthplace of Lord Krishna", icon: "🏛️" },
            ].map((loc) => (
              <button
                key={loc.value}
                onClick={() => updateForm({ sevaLocation: loc.value as "VRINDAVAN" | "MATHURA" })}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  form.sevaLocation === loc.value
                    ? "border-gold-500 bg-gold-50"
                    : "border-gray-200 bg-white hover:border-gold-300"
                }`}
              >
                <span className="text-2xl">{loc.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-charcoal text-sm">{loc.label}</span>
                    {form.sevaLocation === loc.value && (
                      <span className="text-[10px] badge badge-gold">Selected</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{loc.desc}</span>
                </div>
                <MapPin
                  className={`w-4 h-4 ml-auto flex-shrink-0 ${
                    form.sevaLocation === loc.value ? "text-gold-500" : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-4 rounded-xl flex items-start gap-3"
        style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}
      >
        <CalendarDays className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-charcoal font-semibold mb-1">Booking Policy</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Bookings must be placed at least 2 days before the seva date</li>
            <li>• For festival sevas (Janmashtami, Holi etc.), book 7–14 days early</li>
            <li>• If we cannot perform the seva on your date, we will reschedule or refund</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
