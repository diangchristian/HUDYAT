import { useQuery } from "@tanstack/react-query";
import { getLearningAreas } from "@/api/learning-api";

export const learningAreasKey = ["learning-areas"] as const;

export function useLearningAreas() {
  return useQuery({
    queryKey: learningAreasKey,
    queryFn: getLearningAreas,
  });
}
