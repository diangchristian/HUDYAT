-- Pictures that help young readers: on the sign (shared by every lesson) and on the lesson's example.
ALTER TABLE "fsl_gestures" ADD COLUMN "mainPicture" TEXT,
ADD COLUMN "meaningPictures" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "category_gestures" ADD COLUMN "exampleUsagePictures" JSONB NOT NULL DEFAULT '{}';
