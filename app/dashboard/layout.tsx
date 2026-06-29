import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // unreadCount will be wired to a notifications API in a future phase
  return (
    <DashboardSidebar session={session} unreadCount={0}>
      {children}
    </DashboardSidebar>
  );
}
