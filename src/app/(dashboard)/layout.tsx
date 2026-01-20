import { Sidebar } from "@/components/layout/sidebar";
import { BrandProvider } from "@/contexts/brand-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </BrandProvider>
  );
}
