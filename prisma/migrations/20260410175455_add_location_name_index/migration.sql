-- DropIndex
DROP INDEX "Property_district_price_per_sqm_idx";

-- CreateIndex
CREATE INDEX "Property_location_name_idx" ON "Property"("location_name");

-- CreateIndex
CREATE INDEX "Property_location_name_price_per_sqm_idx" ON "Property"("location_name", "price_per_sqm");
