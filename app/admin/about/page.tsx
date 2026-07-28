import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AboutEditorClient } from "@/components/admin/AboutEditorClient";
import { getAboutPageContent } from "@/lib/site-config";

export const metadata: Metadata = { title: "About page" };

export default async function AdminAboutPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const content = await getAboutPageContent();

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">About page</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Edit the public /about page content. Empty fields fall back to the default copy.
          </p>
        </div>
      </div>

      <AboutEditorClient initial={content} />
    </>
  );
}
