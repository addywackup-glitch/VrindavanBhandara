"use client";

// =============================================================================
// BookingStatusTabs — client component for tab + search state management
// Updates URL search params on change so SSR page re-fetches from Prisma
// =============================================================================

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition, useState, useEffect, useRef } from "react";

type Tab = { key: string; label: string };

export function BookingStatusTabs({
  tabs,
  tabCounts,
  activeTab,
  defaultSearch,
}: {
  tabs: Tab[];
  tabCounts: Record<string, number>;
  activeTab: string;
  defaultSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(defaultSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const navigate = useCallback(
    (tab: string, q: string) => {
      const params = new URLSearchParams();
      if (tab !== "ALL") params.set("status", tab.toLowerCase());
      if (q) params.set("q", q);
      const qs = params.toString();
      startTransition(() => {
        router.push(`${pathname}${qs ? `?${qs}` : ""}`);
      });
    },
    [router, pathname]
  );

  const handleTabChange = (tab: string) => {
    navigate(tab, search);
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate(activeTab, search);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <>
      {/* Tabs */}
      <div className="db-tabs" role="tablist" aria-label="Filter bookings by status">
        {tabs.map(({ key, label }) => {
          const count = tabCounts[key] ?? 0;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              className={`db-tab${isActive ? " active" : ""}`}
              onClick={() => handleTabChange(key)}
            >
              {label}
              {count > 0 && (
                <span
                  style={{
                    marginLeft: "0.375rem",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    padding: "0.125rem 0.4rem",
                    borderRadius: "9999px",
                    background: isActive ? "var(--brand)" : "var(--n-200)",
                    color: isActive ? "var(--brand-fg)" : "var(--muted)",
                  }}
                  aria-label={`${count} bookings`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="db-search-bar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          className="db-search-input"
          placeholder="Search by booking number or service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search bookings"
        />
      </div>
    </>
  );
}
