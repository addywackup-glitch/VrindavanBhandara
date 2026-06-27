"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; icon?: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Bhandara Booking", href: "/services/bhandara", icon: "🍱" },
      { label: "Brahmin Bhoj Seva", href: "/services/brahmin-bhoj", icon: "🪔" },
      { label: "Gau Seva", href: "/services/gau-seva", icon: "🐄" },
      { label: "Sadhu Bhojan Seva", href: "/services/sadhu-bhojan", icon: "🌸" },
      { label: "Festival Seva", href: "/services/festival-seva", icon: "🎊" },
    ],
  },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Closing mobile menu on route change is intentional; no cascading renders
    setIsMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const isHome = pathname === "/";
  // For the Sandalwood theme, the background is already light, 
  // so the navbar can always be visible, but we enhance it on scroll.
  const isTransparent = isHome && !isScrolled && !isMobileOpen;

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: isTransparent
            ? "transparent"
            : "rgba(255, 252, 248, 0.95)", // Ivory background
          backdropFilter: isTransparent ? "none" : "blur(20px)",
          WebkitBackdropFilter: isTransparent ? "none" : "blur(20px)",
          borderBottom: isTransparent
            ? "1px solid transparent"
            : "1px solid rgba(184,153,71,0.15)", // Gold border
          boxShadow: isTransparent ? "none" : "0 4px 24px rgba(0,0,0,0.05)",
        }}
      >
        <div className="container flex items-center justify-between h-16 lg:h-[4.5rem]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #B89947, #8B1E1E)", boxShadow: "0 0 20px rgba(139,30,30,0.15)" }}
            >
              <span className="text-lg leading-none">🪔</span>
            </motion.div>
            <div>
              <span
                className="block font-heading font-bold text-base leading-tight"
                style={{ color: "#2A2825" }}
              >
                Vrindavan Bhandara
              </span>
              <span
                className="block text-[9px] tracking-[0.15em] uppercase font-body font-bold"
                style={{ color: "#8B1E1E" }} // Maroon accent
              >
                Spiritual Seva Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="relative group">
                {item.children ? (
                  <div
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200"
                      style={{
                        color: openDropdown === item.label ? "#8B1E1E" : "#4A453F",
                      }}
                    >
                      {item.label}
                      <ChevronDown
                        className="w-3.5 h-3.5 transition-transform duration-200"
                        style={{ transform: openDropdown === item.label ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 mt-2 w-60 rounded-2xl overflow-hidden"
                          style={{
                            background: "rgba(255, 252, 248, 0.98)",
                            border: "1px solid rgba(184,153,71,0.2)",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5)",
                          }}
                        >
                          {item.children.map((child, i) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors duration-150 group/item"
                              style={{
                                color: "#4A453F",
                                borderBottom: i < item.children!.length - 1 ? "1px solid rgba(184,153,71,0.1)" : "none",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(184,153,71,0.08)";
                                e.currentTarget.style.color = "#8B1E1E";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#4A453F";
                              }}
                            >
                              {child.icon && <span className="text-base w-6 text-center">{child.icon}</span>}
                              <span>{child.label}</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="block px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 relative"
                    style={{
                      color: pathname === item.href ? "#8B1E1E" : "#4A453F",
                    }}
                  >
                    {item.label}
                    {pathname === item.href && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{ background: "rgba(139,30,30,0.06)", border: "1px solid rgba(139,30,30,0.15)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center px-4 h-10 rounded-lg text-sm font-bold transition-all duration-200"
              style={{
                color: "#8B1E1E",
                border: "1px solid rgba(139,30,30,0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139,30,30,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Login
            </Link>
            <Link
              href="/services/bhandara"
              className="relative inline-flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-bold text-white overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #8B1E1E, #B89947)",
                boxShadow: "0 4px 15px rgba(139,30,30,0.25)",
              }}
            >
              <Flame className="w-3.5 h-3.5 flex-shrink-0" />
              Book Seva
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors duration-200" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{
              color: "#2A2825",
              background: isMobileOpen ? "rgba(184,153,71,0.15)" : "transparent",
            }}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isMobileOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden bg-white"
              style={{ borderTop: "1px solid rgba(184,153,71,0.2)" }}
            >
              <div className="container py-5 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors"
                      style={{
                        color: pathname === item.href ? "#8B1E1E" : "#4A453F",
                        background: pathname === item.href ? "rgba(139,30,30,0.06)" : "transparent",
                      }}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                            style={{ color: "#4A453F" }}
                          >
                            {child.icon && <span>{child.icon}</span>}
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <Link href="/login" className="px-4 py-3 rounded-xl text-sm font-bold text-center text-[#8B1E1E] border border-[#8B1E1E]/20">
                    Login
                  </Link>
                  <Link
                    href="/services/bhandara"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #8B1E1E, #B89947)" }}
                  >
                    <Flame className="w-4 h-4" />
                    Book Seva Now
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
