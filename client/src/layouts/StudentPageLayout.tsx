import SidebarLayout, { type SidebarNavItem } from "./SidebarLayout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAvatarEmoji } from "@/components/common/avatars.constants";

const navItems: SidebarNavItem[] = [
  { name: "Home", path: "/student/home", image: "/icons/home.png" },
  { name: "Learn", path: "/student/learn", image: "/icons/learn.png" },
  { name: "Practice", path: "/student/practice", image: "/icons/practice.png" },
  { name: "Assessment", path: "/student/assessment", image: "/icons/assessment.png" },
  { name: "My Progress", path: "/student/progress", image: "/icons/progress.png" },
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
