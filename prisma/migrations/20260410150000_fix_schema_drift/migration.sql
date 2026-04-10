-- AlterTable
ALTER TABLE "Property" DROP COLUMN "currency",
DROP COLUMN "scraped_at",
DROP COLUMN "source_platform",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "has_document" BOOLEAN,
ADD COLUMN     "has_mortgage" BOOLEAN,
ADD COLUMN     "has_repair" BOOLEAN;
