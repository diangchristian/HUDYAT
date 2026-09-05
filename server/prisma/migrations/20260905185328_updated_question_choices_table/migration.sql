-- DropForeignKey
ALTER TABLE "question_choices" DROP CONSTRAINT "question_choices_gestureId_fkey";

-- AlterTable
ALTER TABLE "question_choices" ADD COLUMN     "isCorrect" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "gestureId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "question_choices" ADD CONSTRAINT "question_choices_gestureId_fkey" FOREIGN KEY ("gestureId") REFERENCES "fsl_gestures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
