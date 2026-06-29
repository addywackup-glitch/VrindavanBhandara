import type React from "react";

// Admin navigation config
export type AdminNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  badgeKey?: "pendingBookings";
  icon: React.ReactNode;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const icon = (paths: React.ReactNode) => (
  <span className="adm-nav-icon">
    <svg viewBox="0 0 24 24" aria-hidden="true">{paths}</svg>
  </span>
);

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        exact: true,
        icon: icon(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>),
      },
      {
        href: "/admin/bookings",
        label: "Bookings",
        badgeKey: "pendingBookings",
        icon: icon(<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2" />),
      },
      {
        href: "/admin/users",
        label: "Customers",
        icon: icon(<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8" />),
      },
      {
        href: "/admin/refunds",
        label: "Refunds",
        icon: icon(<path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" />),
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        href: "/admin/services",
        label: "Services",
        icon: icon(<path d="M12 2L8 6H4v4l-2 2 2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z" />),
      },
      {
        href: "/admin/packages",
        label: "Packages",
        icon: icon(<path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8l-2 4h12l-2-4z" />),
      },
      {
        href: "/admin/gallery",
        label: "Gallery",
        icon: icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>),
      },
      {
        href: "/admin/testimonials",
        label: "Testimonials",
        icon: icon(<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />),
      },
      {
        href: "/admin/faqs",
        label: "FAQs",
        icon: icon(<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" /></>),
      },
      {
        href: "/admin/blog",
        label: "Blog",
        icon: icon(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>),
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/admin/proofs",
        label: "Proof Uploads",
        icon: icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>),
      },
      {
        href: "/admin/messages",
        label: "Messages",
        icon: icon(<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />),
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: icon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />),
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/admin/roles",
        label: "Roles & Admins",
        icon: icon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />),
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" /></>),
      },
    ],
  },
];

/** Derive page title + breadcrumb from pathname */
export function getAdminPageMeta(pathname: string): { title: string; breadcrumb: string } {
  if (pathname === "/admin") return { title: "Dashboard", breadcrumb: "/ Overview" };
  if (pathname.startsWith("/admin/bookings/")) return { title: "Booking Detail", breadcrumb: "/ Bookings / Detail" };
  if (pathname === "/admin/bookings") return { title: "Bookings", breadcrumb: "/ Operations / Bookings" };
  if (pathname.startsWith("/admin/users/")) return { title: "Customer Detail", breadcrumb: "/ Customers / Detail" };
  if (pathname === "/admin/users") return { title: "Customers", breadcrumb: "/ Operations / Customers" };
  if (pathname === "/admin/refunds") return { title: "Refunds", breadcrumb: "/ Operations / Refunds" };
  if (pathname === "/admin/analytics") return { title: "Analytics", breadcrumb: "/ Reports / Analytics" };
  if (pathname === "/admin/packages") return { title: "Packages", breadcrumb: "/ Content / Packages" };
  if (pathname === "/admin/services") return { title: "Services", breadcrumb: "/ Content / Services" };
  if (pathname === "/admin/gallery") return { title: "Gallery", breadcrumb: "/ Content / Gallery" };
  if (pathname === "/admin/testimonials") return { title: "Testimonials", breadcrumb: "/ Content / Testimonials" };
  if (pathname === "/admin/faqs") return { title: "FAQs", breadcrumb: "/ Content / FAQs" };
  if (pathname === "/admin/proofs") return { title: "Proof Uploads", breadcrumb: "/ Operations / Proofs" };
  if (pathname === "/admin/messages") return { title: "Messages", breadcrumb: "/ Operations / Messages" };
  if (pathname === "/admin/roles") return { title: "Roles & Admins", breadcrumb: "/ System / Roles" };
  if (pathname === "/admin/settings") return { title: "Settings", breadcrumb: "/ System / Settings" };
  if (pathname.startsWith("/admin/blog")) return { title: "Blog", breadcrumb: "/ Content / Blog" };
  return { title: "Admin", breadcrumb: "" };
}
