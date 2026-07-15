import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user,role } = await requireUser();
  return <AppShell userName={user.name} role={role}>{children}</AppShell>;
}
