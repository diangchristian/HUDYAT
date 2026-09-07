import { useQuery } from "@tanstack/react-query";
import { getCategoryLesson } from "@/api/learning-api";

export const categoryLessonKey = (categoryId: string | undefined) =>
  ["category-lesson", categoryId] as const;

export function useCategoryLesson(categoryId: string | undefined) {
  return useQuery({
    queryKey: categoryLessonKey(categoryId),
    queryFn: () => getCategoryLesson(categoryId!),
    enabled: Boolean(categoryId),
  });
}
