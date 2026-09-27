import { useQuery } from "@tanstack/react-query";
import { getTeacherDashboard } from "@/api/teacher-api";

export const teacherDashboardKey = ["teacher", "dashboard"] as const;

export function useTeacherDashboard() {
  return useQuery({
    queryKey: teacherDashboardKey,
    queryFn: ({ signal }) => getTeacherDashboard(signal),
  });
}
