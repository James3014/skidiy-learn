-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN "resortId" INTEGER;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_resortId_fkey" FOREIGN KEY ("resortId") REFERENCES "Resort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- BackfillData: Update existing instructors with their primary resort
-- This finds the most frequently used resort for each instructor
UPDATE "Instructor" i
SET "resortId" = (
  SELECT l."resortId"
  FROM "Lesson" l
  WHERE l."instructorId" = i.id
  GROUP BY l."resortId"
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "Lesson" l WHERE l."instructorId" = i.id
);
