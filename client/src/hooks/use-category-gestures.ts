import { useQuery } from "@tanstack/react-query";
import { getCategoryGestures } from "@/api/teacher-api";

export const categoryGesturesKey = (categoryId: string | undefined) =>
  ["teacher", "category-gestures", categoryId] as const;

export function useCategoryGestures(categoryId: string | undefined) {
  return useQuery({
    queryKey: categoryGesturesKey(categoryId),
    queryFn: ({ signal }) => getCategoryGestures(categoryId!, signal),
    enabled: Boolean(categoryId),
    staleTime: Infinity,
  });
}
