import {
  GraduationCap,
  History,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

import StaffLayout, { type StaffNavItem } from "./StaffLayout";

const navItems: StaffNavItem[] = [
  { name: "Overview", path: "/admin/overview", icon: LayoutDashboard },
  { name: "Teachers", path: "/admin/teachers", icon: GraduationCap },
  { name: "Learners", path: "/admin/learners", icon: Users },
  { name: "Activity log", path: "/admin/activity", icon: History },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

const AdminPageLayout = () => (
  <StaffLayout
    navItems={navItems}
    loginPath="/admin/login"
    portalName="Admin Console"
    variant="admin"
  />
);

export default AdminPageLayout;
