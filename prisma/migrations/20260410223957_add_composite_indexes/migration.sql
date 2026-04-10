-- CreateIndex
CREATE INDEX "Property_location_name_is_urgent_posted_date_idx" ON "Property"("location_name", "is_urgent", "posted_date");

-- CreateIndex
CREATE INDEX "Property_district_price_per_sqm_idx" ON "Property"("district", "price_per_sqm");

-- CreateIndex
CREATE INDEX "Property_location_name_district_posted_date_idx" ON "Property"("location_name", "district", "posted_date");
