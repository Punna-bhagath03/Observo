-- CreateTable
CREATE TABLE "incident" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incident_website_id_region_id_started_at_idx" ON "incident"("website_id", "region_id", "started_at");

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "website"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
