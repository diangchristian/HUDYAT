-- Teaching order for Basic Filipino Sign Language: Alphabet, Numbers, Greetings, Family,
-- Colors, Shapes, Calendar. Data only; databases seeded later already get these values.
-- The categories are moved out of the way first because displayOrder is unique per area.
UPDATE "categories" SET "displayOrder" = "displayOrder" + 1000
WHERE "learningAreaId" IN (SELECT "id" FROM "learning_areas" WHERE "name" = 'Basic Filipino Sign Language')
  AND "name" IN ('Alphabet', 'Numbers', 'Greetings', 'Family', 'Colors', 'Shapes', 'Calendar');

UPDATE "categories" SET "displayOrder" = CASE "name"
    WHEN 'Alphabet' THEN 1
    WHEN 'Numbers' THEN 2
    WHEN 'Greetings' THEN 3
    WHEN 'Family' THEN 4
    WHEN 'Colors' THEN 5
    WHEN 'Shapes' THEN 6
    WHEN 'Calendar' THEN 7
  END
WHERE "learningAreaId" IN (SELECT "id" FROM "learning_areas" WHERE "name" = 'Basic Filipino Sign Language')
  AND "name" IN ('Alphabet', 'Numbers', 'Greetings', 'Family', 'Colors', 'Shapes', 'Calendar');
