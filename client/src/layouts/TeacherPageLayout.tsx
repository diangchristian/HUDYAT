import {
  BookOpen,
  FileQuestion,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

import StaffLayout, { type StaffNavItem } from "./StaffLayout";

const navItems: StaffNavItem[] = [
  { name: "Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
  { name: "Lessons", path: "/teacher/lessons", icon: BookOpen },
  { name: "Quizzes", path: "/teacher/quizzes", icon: FileQuestion },
  { name: "Students", path: "/teacher/students", icon: Users },
  { name: "Settings", path: "/teacher/settings", icon: Settings },
];

const TeacherPageLayout = () => (
  <StaffLayout
    navItems={navItems}
    loginPath="/teacher/login"
    portalName="FSL Learning Support"
  />
);

export default TeacherPageLayout;
