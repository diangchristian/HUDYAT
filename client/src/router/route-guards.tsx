import { Navigate, Outlet, useLocation } from "react-router";

import type { UserRole } from "@/api/auth-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import LoadingScreen from "@/components/common/loading-screen";
import StaffLoadingScreen from "@/components/staff/staff-loading-screen";
import { isStandalonePwa } from "@/lib/pwa";

/*
 * Where a logged-in user of each role belongs. Roles without an
 * entry here (ADMIN) have no dashboard built yet, so they fall back
 * to the public home page "/" until their own area exists.
 */
const ROLE_HOME_PATH: Partial<Record<UserRole, string>> = {
  LEARNER: "/student/home",
  TEACHER: "/teacher/dashboard",
};

function roleHomePath(role: UserRole) {
  return ROLE_HOME_PATH[role] ?? "/";
}

function useAuthState() {
  const hasToken = Boolean(localStorage.getItem("token"));
  const { data: user, isLoading } = useCurrentUser();

  return { hasToken, user, isLoading };
}

// The Hudyat loading screen is student-only; staff areas get a plain loader.
const STAFF_PATH = /^\/(teacher|admin)(\/|$)/;

function AuthLoading() {
  const { pathname } = useLocation();

  return STAFF_PATH.test(pathname) ? <StaffLoadingScreen /> : <LoadingScreen />;
}

/*
 * For public-only pages ("/", "/login", "/teacher/login"). A
 * logged-in user is sent to their role's home instead of seeing
 * these pages, unless their role's home IS the page they're already
 * on (e.g. ADMIN on "/", since they have nowhere else to go yet).
 */
export function RequireGuest() {
  const location = useLocation();
  const { hasToken, user, isLoading } = useAuthState();

  if (hasToken && isLoading) return <AuthLoading />;

  if (hasToken && user) {
    const homePath = roleHomePath(user.role);

    if (homePath !== location.pathname) {
      return <Navigate to={homePath} replace />;
    }

    return <Outlet />;
  }

  /*
   * Guest (no token, or token present but user fetch failed). An
   * installed/standalone PWA has no reason to show the marketing
   * landing page — send it straight to the login screen instead.
   */
  if (isStandalonePwa() && location.pathname === "/") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/*
 * For pages that require being logged in as one of `allowedRoles`.
 * Logged-out users go to `loginPath` (each role has its own login
 * screen); logged-in users of the wrong role go to their own role's
 * home instead.
 */
export function RequireRole({
  allowedRoles,
  loginPath = "/login",
}: {
  allowedRoles: UserRole[];
  loginPath?: string;
}) {
  const { hasToken, user, isLoading } = useAuthState();

  if (!hasToken) return <Navigate to={loginPath} replace />;
  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to={loginPath} replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}
