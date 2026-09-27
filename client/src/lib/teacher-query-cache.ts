import type { QueryClient } from "@tanstack/react-query";

import type { AuthoringAssessment } from "@/api/teacher-api";
import { teacherAssessmentKey } from "@/hooks/use-teacher-assessment";
import { teacherAssessmentsKey } from "@/hooks/use-teacher-assessments";
import { teacherDashboardKey } from "@/hooks/use-teacher-dashboard";

/*
 * Every quiz-authoring endpoint responds with the full, updated
 * assessment, so the editor's cache is replaced directly instead of
 * refetched. The quiz list and dashboard summaries are invalidated.
 */
export function applyAuthoringResult(
  queryClient: QueryClient,
  assessment: AuthoringAssessment,
) {
  queryClient.setQueryData(
    teacherAssessmentKey(assessment.category.id),
    assessment,
  );
  void queryClient.invalidateQueries({ queryKey: teacherAssessmentsKey });
  void queryClient.invalidateQueries({ queryKey: teacherDashboardKey });
}
