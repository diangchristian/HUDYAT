import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "@/api/admin-api";

// Every admin query starts with this, so one change can refresh them all.
export const adminKey = ["admin"] as const;

export function useAdminOverview() {
  return useQuery({
    queryKey: [...adminKey, "overview"],
    queryFn: ({ signal }) => getAdminOverview(signal),
  });
}
