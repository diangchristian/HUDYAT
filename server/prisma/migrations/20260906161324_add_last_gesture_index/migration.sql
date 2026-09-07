/*
  Warnings:

  - You are about to drop the column `isUnlocked` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `isCorrect` on the `question_choices` table. All the data in the column will be lost.
  - Made the column `gestureId` on table `question_choices` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "question_choices" DROP CONSTRAINT "question_choices_gestureId_fkey";

-- AlterTable
ALTER TABLE "assessments" DROP COLUMN "isUnlocked";

-- AlterTable
ALTER TABLE "question_choices" DROP COLUMN "isCorrect",
ALTER COLUMN "gestureId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "question_choices" ADD CONSTRAINT "question_choices_gestureId_fkey" FOREIGN KEY ("gestureId") REFERENCES "fsl_gestures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
