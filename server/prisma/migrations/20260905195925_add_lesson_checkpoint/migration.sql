-- AlterTable
ALTER TABLE "category_progress" ADD COLUMN     "lastGestureIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLessonStep" TEXT;
