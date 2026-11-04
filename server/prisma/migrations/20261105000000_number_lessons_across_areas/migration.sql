-- Continues Communication's lesson numbers after Basic Filipino Sign Language, which ends at 7.
-- Data only. Word Concepts moves first because displayOrder is unique per area.
UPDATE "categories" SET "displayOrder" = 9
WHERE "name" = 'Word Concepts'
  AND "displayOrder" = 8
  AND "learningAreaId" IN (SELECT "id" FROM "learning_areas" WHERE "name" = 'Communication');

UPDATE "categories" SET "displayOrder" = 8
WHERE "name" = 'WH Questions'
  AND "displayOrder" = 7
  AND "learningAreaId" IN (SELECT "id" FROM "learning_areas" WHERE "name" = 'Communication');
