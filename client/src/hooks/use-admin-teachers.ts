import { useQuery } from "@tanstack/react-query";
import { getAdminTeachers } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useAdminTeachers() {
  return useQuery({
    queryKey: [...adminKey, "teachers"],
    queryFn: ({ signal }) => getAdminTeachers(signal),
  });
}
