CREATE INDEX "website_tick_website_id_region_id_createdAt_idx"
ON "website_tick"("website_id", "region_id", "createdAt");

CREATE INDEX "incident_website_id_region_id_resolved_at_idx"
ON "incident"("website_id", "region_id", "resolved_at");
