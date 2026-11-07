import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";

import { useLogout } from "@/hooks/use-logout";
import CartoonNavIcon from "./student-nav/cartoon-nav-icon";
import "./student-nav/student-nav.css";

export type SidebarNavItem = {
  name: string;
  path: string;
};

type SidebarLayoutProps = {
  navItems: SidebarNavItem[];
  settingsPath: string;
  /** Where to land after logging out (each role has its own login). */
  loginPath: string;
  avatar: ReactNode;
  subtitle: string;
};

export default function SidebarLayout({
  navItems,
  settingsPath,
  loginPath,
  avatar,
  subtitle,
}: SidebarLayoutProps) {
  const navigate = useNavigate();
  const logout = useLogout(loginPath);
  const [showPopover, setShowPopover] = useState(false);

  const handleLogout = () => {
    setShowPopover(false);
    logout();
  };

  const handleSettings = () => {
    setShowPopover(false);
    navigate(settingsPath);
  };

  const handleOtherKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === "Escape") {
      setShowPopover(false);
      event.currentTarget.querySelector("button")?.focus();
    }
  };

  const menuItems = (
    <>
      <button type="button" onClick={handleSettings} className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-foreground/5">
        Settings
      </button>
      <button type="button" onClick={handleLogout} className="w-full border-t px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
        Logout
      </button>
    </>
  );

  return (
    <div
      className="student-nav flex min-h-screen flex-col lg:flex-row"
      data-nav-menu-open={showPopover ? "open" : undefined}
    >
      <div className="hidden shrink-0 lg:block lg:w-64" aria-hidden="true" />

      <aside className="student-nav-sidebar hidden overflow-y-auto border-r-2 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="student-nav-brand flex items-center gap-3 border-b px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5C04A] text-2xl">{avatar}</div>
          <div>
            <h1 className="font-body text-2xl font-bold">Hudyat</h1>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        <nav className="px-3 py-6" aria-label="Student navigation">
          <ul className="student-nav-links">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  data-nav-name={item.name}
                  end={item.path === "/"}
                  className={({ isActive }) => `student-nav-link flex items-center gap-3 px-3 py-3 font-body${isActive ? " student-nav-active" : ""}`}
                >
                  <span className="student-nav-icon"><CartoonNavIcon name={item.name} /></span>
                  <span className="student-nav-label">{item.name}</span>
                </NavLink>
              </li>
            ))}
            <li className="relative" onKeyDown={handleOtherKeyDown}>
              <button
                type="button"
                onClick={() => setShowPopover((open) => !open)}
                aria-expanded={showPopover}
                aria-controls="student-desktop-other-menu"
                data-nav-name="Other"
                className={`student-nav-link flex w-full items-center gap-3 px-3 py-3 font-body${showPopover ? " student-nav-active" : ""}`}
              >
                <span className="student-nav-icon"><CartoonNavIcon name="Other" /></span>
                <span className="student-nav-label">Other</span>
              </button>
              {showPopover && (
                <div id="student-desktop-other-menu" className="student-nav-menu absolute right-0 top-full mt-2">
                  {menuItems}
                </div>
              )}
            </li>
          </ul>
        </nav>
      </aside>

      <main className="student-nav-content mx-auto max-w-6xl flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8"><Outlet /></div>
      </main>

      <nav className="student-nav-bottom fixed inset-x-0 bottom-0 border-t-2 lg:hidden" aria-label="Student navigation">
        <ul className="flex items-center justify-around">
          {navItems.map((item) => (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                data-nav-name={item.name}
                end={item.path === "/"}
                aria-label={item.name}
                className={({ isActive }) => `student-nav-link${isActive ? " student-nav-active" : ""}`}
              >
                <span className="student-nav-icon"><CartoonNavIcon name={item.name} /></span>
                <span className="student-nav-label student-nav-mobile-label">{item.name}</span>
              </NavLink>
            </li>
          ))}
          <li className="relative flex-1" onKeyDown={handleOtherKeyDown}>
            <button
              type="button"
              onClick={() => setShowPopover((open) => !open)}
              aria-label="Other"
              aria-expanded={showPopover}
              aria-controls="student-mobile-other-menu"
              data-nav-name="Other"
              className={`student-nav-link w-full${showPopover ? " student-nav-active" : ""}`}
            >
              <span className="student-nav-icon"><CartoonNavIcon name="Other" /></span>
              <span className="student-nav-label student-nav-mobile-label">Other</span>
            </button>
            {showPopover && (
              <div id="student-mobile-other-menu" className="student-nav-menu absolute bottom-full right-0 mb-2">
                {menuItems}
              </div>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}
