import { useQuery } from "@tanstack/react-query";
import { getAdminLessons } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useAdminLessons() {
  return useQuery({
    queryKey: [...adminKey, "lessons"],
    queryFn: ({ signal }) => getAdminLessons(signal),
  });
}
