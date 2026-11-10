-- A learner's Sign test results (optional, camera-checked; never affects lesson unlocking).
CREATE TABLE "sign_test_attempts" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "missedGestureIds" JSONB NOT NULL DEFAULT '[]',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sign_test_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sign_test_attempts_learnerId_categoryId_idx" ON "sign_test_attempts"("learnerId", "categoryId");

ALTER TABLE "sign_test_attempts" ADD CONSTRAINT "sign_test_attempts_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learner_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sign_test_attempts" ADD CONSTRAINT "sign_test_attempts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
