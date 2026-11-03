import { useMutation } from "@tanstack/react-query";
import { uploadLessonMedia } from "@/api/teacher-api";

/** Lets the lesson form hold Save until every upload has finished. */
export const lessonMediaUploadKey = ["lesson-media-upload"];

export function useUploadLessonMedia(onProgress: (percent: number) => void) {
  return useMutation({
    mutationKey: lessonMediaUploadKey,
    mutationFn: (file: File) => uploadLessonMedia(file, onProgress),
  });
}
