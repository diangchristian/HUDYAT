import { useQuery } from "@tanstack/react-query";
import { getMyProgress } from "@/api/progress-api";

export const myProgressKey = ["progress"] as const;

export function useMyProgress() {
  return useQuery({
    queryKey: myProgressKey,
    queryFn: ({ signal }) => getMyProgress(signal),
  });
}
