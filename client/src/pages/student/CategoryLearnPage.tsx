import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { useCategoryLesson } from "@/hooks/use-category-lesson";
import LoadingScreen from "@/components/common/loading-screen";
import SessionHeader from "@/components/common/session-header";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";

import LearnSession, { type LessonPrompt } from "./category-learn/learn-session";

const LESSON_TO_ASSESSMENT_TRANSITION_MS = 1400;

export default function CategoryLearnPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [isFinishingLesson, setIsFinishingLesson] = useState(false);
  const { data: lesson, isLoading, error, refetch } = useCategoryLesson(categoryId);

  const handleFinishLesson = () => {
    setIsFinishingLesson(true);
    setTimeout(() => navigate(`/student/assessment/${categoryId}`), LESSON_TO_ASSESSMENT_TRANSITION_MS);
  };

  if (isFinishingLesson) {
    return <LoadingScreen />;
  }

  const prompts: LessonPrompt[] =
    lesson?.categoryGestures.map((item) => ({
      label: item.gesture.label,
      modelClass: item.gesture.modelClass,
      meaning: item.gesture.meaning ?? undefined,
      whenToUse: item.exampleUsage ?? undefined,
      mainPicture: item.gesture.mainPicture,
      meaningPictures: item.gesture.meaningPictures,
      whenToUsePictures: item.exampleUsagePictures,
      referenceImageUrl: item.gesture.referenceImageUrl ?? undefined,
      referenceVideoUrl: item.gesture.referenceVideoUrl ?? undefined,
    })) ?? [];

  // The lesson is full-screen with its own trail header and bottom bar.
  // A locked lesson's link still loads (Practice uses the same data), but it can't be studied yet.
  const locked = lesson?.learningStatus === "locked";

  if (!isLoading && !error && lesson?.category && prompts.length && !locked) {
    return (
      <LearnSession
        key={lesson.category.id}
        categoryId={lesson.category.id}
        title={lesson.category.name}
        prompts={prompts}
        initialGestureIndex={lesson.progress.lastGestureIndex}
        initialStep={lesson.progress.lastLessonStep}
        onFinishLesson={handleFinishLesson}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-background font-body text-foreground">
      <SessionHeader backTo="/student/learn" backLabel="Hudyat — back to learning categories" />

      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-12">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground" role="status">
            Loading this lesson...
          </p>
        ) : error || !categoryId ? (
          <div className="py-12 text-center">
            <p className="text-sm font-bold text-destructive" role="alert">
              {error instanceof Error
                ? error.message
                : !categoryId
                  ? "Category not found."
                  : "We couldn't load this lesson right now."}
            </p>

            {categoryId && error && (
              <ElevatedButton
                text="TRY AGAIN"
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                className="mt-4 min-h-9"
                onClick={() => void refetch()}
              />
            )}
          </div>
        ) : (
          <Card className="mx-auto max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold">{locked ? "Not yet!" : "Category not found"}</h1>
            <p className="my-4 text-muted-foreground">
              {locked ? "Finish the lessons before this one first." : "Choose an available category to start learning."}
            </p>
            <ElevatedButton
              text="BACK TO LEARN"
              variant="secondary"
              className="min-h-11"
              onClick={() => navigate("/student/learn")}
            />
          </Card>
        )}
      </main>
    </div>
  );
}
