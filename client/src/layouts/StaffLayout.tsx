import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { LogOut, Menu, type LucideIcon } from "lucide-react";

import BrandMark from "@/components/staff/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLogout } from "@/hooks/use-logout";
import { useStaffTheme } from "@/hooks/use-staff-theme";
import { cn } from "@/lib/utils";

export type StaffNavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
};

type StaffLayoutProps = {
  navItems: StaffNavItem[];
  /** Where to land after logging out (each role has its own login). */
  loginPath: string;
  portalName: string;
};

function StaffNav({
  navItems,
  onNavigate,
  onLogout,
}: {
  navItems: StaffNavItem[];
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <nav aria-label="Main">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold tracking-wide transition-colors",
                    isActive
                      ? "bg-staff-nav text-white"
                      : "text-secondary-foreground/80 hover:bg-accent hover:text-accent-foreground",
                  )
                }
              >
                <item.icon aria-hidden="true" className="size-5" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold tracking-wide text-secondary-foreground/80 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        <LogOut aria-hidden="true" className="size-5" />
        Logout
      </button>
    </div>
  );
}

/*
 * Shell for the staff (teacher/admin) portals: a fixed sidebar on
 * desktop and a top bar with a slide-out menu on mobile, rendered in
 * the staff theme.
 */
export default function StaffLayout({
  navItems,
  loginPath,
  portalName,
}: StaffLayoutProps) {
  const logout = useLogout(loginPath);
  const [menuOpen, setMenuOpen] = useState(false);

  useStaffTheme();

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <div className="min-h-screen bg-white font-staff text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-66 flex-col border-r border-border bg-white px-4 py-5 lg:flex">
        <BrandMark subtitle={portalName} className="mb-8 px-2" />
        <StaffNav navItems={navItems} onLogout={handleLogout} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <BrandMark subtitle={portalName} />

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-lg" aria-label="Open menu" />
            }
          >
            <Menu aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 gap-0 p-4 font-staff">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <BrandMark subtitle={portalName} className="mb-6 px-2 pt-1" />
            <StaffNav
              navItems={navItems}
              onNavigate={() => setMenuOpen(false)}
              onLogout={handleLogout}
            />
          </SheetContent>
        </Sheet>
      </header>

      <main className="lg:pl-66">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
