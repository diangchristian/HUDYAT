import { useQuery } from "@tanstack/react-query";
import { getLearnerDetail } from "@/api/teacher-api";

export const learnerDetailKey = (learnerId: string | undefined) =>
  ["teacher", "learners", learnerId] as const;

export function useLearnerDetail(learnerId: string | undefined) {
  return useQuery({
    queryKey: learnerDetailKey(learnerId),
    queryFn: ({ signal }) => getLearnerDetail(learnerId!, signal),
    enabled: Boolean(learnerId),
  });
}
