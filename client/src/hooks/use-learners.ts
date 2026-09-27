import { useQuery } from "@tanstack/react-query";
import { getLearners } from "@/api/teacher-api";

export const learnersKey = ["teacher", "learners"] as const;

export function useLearners() {
  return useQuery({
    queryKey: learnersKey,
    queryFn: ({ signal }) => getLearners(signal),
  });
}
