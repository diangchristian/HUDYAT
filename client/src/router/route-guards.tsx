import { Navigate, Outlet, useLocation } from "react-router";

import type { UserRole } from "@/api/auth-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import LoadingScreen from "@/components/common/loading-screen";
import ForcedPasswordChange from "@/components/staff/forced-password-change";
import StaffLoadingScreen from "@/components/staff/staff-loading-screen";
import { isStandalonePwa } from "@/lib/pwa";

/* Where a logged-in user of each role belongs. */
const ROLE_HOME_PATH: Record<UserRole, string> = {
  LEARNER: "/student/home",
  TEACHER: "/teacher/dashboard",
  ADMIN: "/admin/overview",
};

function roleHomePath(role: UserRole) {
  return ROLE_HOME_PATH[role];
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
 * For public-only pages ("/" and the login screens). A logged-in user
 * is sent to their role's home instead of seeing these pages.
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

  if (user.mustChangePassword) {
    return <ForcedPasswordChange loginPath={loginPath} />;
  }

  return <Outlet />;
}
