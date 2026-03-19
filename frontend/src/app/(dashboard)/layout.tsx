import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <Sidebar userRole={(session?.user as any)?.role} />
      <div className="md:pl-60">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
