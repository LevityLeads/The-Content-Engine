import { Sidebar, MobileHeader } from "@/components/layout/sidebar";
import { BrandProvider } from "@/contexts/brand-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider>
      <div className="flex h-screen flex-col md:flex-row">
        {/* Mobile Header - visible on small screens */}
        <MobileHeader />

        {/* Desktop Sidebar - hidden on small screens */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </BrandProvider>
  );
}
