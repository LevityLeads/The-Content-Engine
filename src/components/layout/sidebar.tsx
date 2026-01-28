"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileInput,
  Lightbulb,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Zap,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandSwitcher } from "@/components/brand/brand-switcher";
import { SimplifiedBrandOnboarding } from "@/components/brand/simplified-brand-onboarding";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inputs", href: "/inputs", icon: FileInput },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Content", href: "/content", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

// Shared navigation content used by both desktop sidebar and mobile drawer
function SidebarContent({
  onNavClick,
  onAddBrand
}: {
  onNavClick?: () => void;
  onAddBrand: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[hsl(200,20%,5%)]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-[hsl(200,15%,15%)]">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-white">Content</span>
          <span className="text-primary font-semibold -mt-1">Engine</span>
        </div>
      </div>

      {/* Brand Switcher */}
      <div className="p-4 border-b border-[hsl(200,15%,15%)]">
        <BrandSwitcher onAddNew={onAddBrand} />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all min-h-[44px]",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-[hsl(200,10%,55%)] hover:text-white hover:bg-[hsl(200,15%,12%)] active:bg-[hsl(200,15%,18%)]"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-primary" : ""
              )} />
              {item.name}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-[hsl(200,15%,15%)] p-4">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all min-h-[44px]",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-[hsl(200,10%,55%)] hover:text-white hover:bg-[hsl(200,15%,12%)] active:bg-[hsl(200,15%,18%)]"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-primary" : ""
              )} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* User section at bottom */}
      <div className="border-t border-[hsl(200,15%,15%)] p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold flex-shrink-0">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User</p>
            <p className="text-xs text-[hsl(200,10%,55%)] truncate">Multi-Client Mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Header with hamburger menu
export function MobileHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[hsl(200,15%,15%)] bg-[hsl(200,20%,5%)] px-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-[hsl(200,15%,12%)] active:bg-[hsl(200,15%,18%)] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-white">Content Engine</span>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 border-r border-[hsl(200,15%,15%)]">
          <SidebarContent
            onNavClick={() => setMobileMenuOpen(false)}
            onAddBrand={() => {
              setMobileMenuOpen(false);
              setShowBrandDialog(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Brand Creation Dialog */}
      <SimplifiedBrandOnboarding
        open={showBrandDialog}
        onOpenChange={setShowBrandDialog}
      />
    </>
  );
}

// Desktop Sidebar
export function Sidebar() {
  const [showBrandDialog, setShowBrandDialog] = useState(false);

  return (
    <>
      <div className="hidden md:flex h-full w-64 flex-col border-r border-[hsl(200,15%,15%)]">
        <SidebarContent onAddBrand={() => setShowBrandDialog(true)} />
      </div>

      {/* Brand Creation Dialog */}
      <SimplifiedBrandOnboarding
        open={showBrandDialog}
        onOpenChange={setShowBrandDialog}
      />
    </>
  );
}
