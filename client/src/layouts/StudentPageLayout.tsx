import SidebarLayout, { type SidebarNavItem } from "./SidebarLayout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAvatarEmoji } from "@/components/common/avatars.constants";

const navItems: SidebarNavItem[] = [
  { name: "Home", path: "/student/home" },
  { name: "Learn", path: "/student/learn" },
  { name: "Practice", path: "/student/practice" },
  { name: "Assessment", path: "/student/assessment" },
  { name: "My Progress", path: "/student/progress" },
];

const StudentPageLayout = () => {
  const { data: user } = useCurrentUser();

  return (
    <SidebarLayout
      navItems={navItems}
      settingsPath="/student/settings"
      loginPath="/login"
      avatar={getAvatarEmoji(user?.avatarKey)}
      subtitle="FSL Learning Support"
    />
  );
};

export default StudentPageLayout;
