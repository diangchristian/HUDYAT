import { useQuery } from "@tanstack/react-query";
import { getAdminLearners } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useAdminLearners() {
  return useQuery({
    queryKey: [...adminKey, "learners"],
    queryFn: ({ signal }) => getAdminLearners(signal),
  });
}
