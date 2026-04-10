-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_platform" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "area_sqm" DECIMAL(8,2) NOT NULL,
    "price_per_sqm" DECIMAL(10,2) NOT NULL,
    "district" TEXT NOT NULL,
    "rooms" INTEGER,
    "floor" INTEGER,
    "total_floors" INTEGER,
    "description" TEXT,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "posted_date" TIMESTAMP(3),
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_source_url_key" ON "Property"("source_url");

-- CreateIndex
CREATE INDEX "Property_district_idx" ON "Property"("district");

-- CreateIndex
CREATE INDEX "Property_is_urgent_idx" ON "Property"("is_urgent");

-- CreateIndex
CREATE INDEX "Property_price_per_sqm_idx" ON "Property"("price_per_sqm");

-- CreateIndex
CREATE INDEX "Property_district_price_per_sqm_idx" ON "Property"("district", "price_per_sqm");
