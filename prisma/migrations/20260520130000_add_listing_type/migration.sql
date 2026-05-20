CREATE TYPE "ListingType" AS ENUM ('sale', 'rent');

ALTER TABLE "Property"
  ADD COLUMN listing_type "ListingType" NOT NULL DEFAULT 'sale';

UPDATE "Property"
SET listing_type = 'rent',
    category = NULL
WHERE category::text = 'rent';

CREATE TYPE "PropertyCategory_new" AS ENUM ('new', 'old', 'house');

ALTER TABLE "Property"
  ALTER COLUMN category TYPE "PropertyCategory_new"
  USING category::text::"PropertyCategory_new";

DROP TYPE "PropertyCategory";

ALTER TYPE "PropertyCategory_new" RENAME TO "PropertyCategory";

CREATE INDEX "Property_listing_type_idx" ON "Property"("listing_type");
