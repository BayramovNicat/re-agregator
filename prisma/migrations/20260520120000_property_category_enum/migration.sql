CREATE TYPE "PropertyCategory" AS ENUM ('new', 'old', 'house', 'rent');

ALTER TABLE "Property"
  ALTER COLUMN category TYPE "PropertyCategory"
  USING category::"PropertyCategory";
