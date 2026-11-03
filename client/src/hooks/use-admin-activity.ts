import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAdminActivity, type ActivityAction } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useAdminActivity(query: { action?: ActivityAction; page: number }) {
  return useQuery({
    queryKey: [...adminKey, "activity", query],
    queryFn: ({ signal }) => getAdminActivity(query, signal),
    placeholderData: keepPreviousData,
  });
}
