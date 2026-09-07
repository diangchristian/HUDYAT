import { Navigate, Outlet, useLocation } from "react-router";

import type { UserRole } from "@/api/auth-api";
import { useCurrentUser } from "@/hooks/use-current-user";

/*
 * Where a logged-in user of each role belongs. Roles without an
 * entry here (TEACHER, ADMIN) have no dashboard built yet, so they
 * fall back to the public home page "/" until their own areas exist.
 */
const ROLE_HOME_PATH: Partial<Record<UserRole, string>> = {
  LEARNER: "/student/home",
};

function roleHomePath(role: UserRole) {
  return ROLE_HOME_PATH[role] ?? "/";
}

function useAuthState() {
  const hasToken = Boolean(localStorage.getItem("token"));
  const { data: user, isLoading } = useCurrentUser();

  return { hasToken, user, isLoading };
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground" role="status">
        Loading...
      </p>
    </div>
  );
}

/*
 * For public-only pages ("/", "/login"). A logged-in user is sent
 * to their role's home instead of seeing these pages, unless their
 * role's home IS the page they're already on (e.g. TEACHER/ADMIN on
 * "/", since they have nowhere else to go yet).
 */
export function RequireGuest() {
  const location = useLocation();
  const { hasToken, user, isLoading } = useAuthState();

  if (!hasToken) return <Outlet />;
  if (isLoading) return <AuthLoading />;
  if (!user) return <Outlet />;

  const homePath = roleHomePath(user.role);

  if (homePath === location.pathname) return <Outlet />;

  return <Navigate to={homePath} replace />;
}

/*
 * For pages that require being logged in as one of `allowedRoles`.
 * Logged-out users go to /login; logged-in users of the wrong role
 * go to their own role's home instead.
 */
export function RequireRole({
  allowedRoles,
}: {
  allowedRoles: UserRole[];
}) {
  const { hasToken, user, isLoading } = useAuthState();

  if (!hasToken) return <Navigate to="/login" replace />;
  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}
