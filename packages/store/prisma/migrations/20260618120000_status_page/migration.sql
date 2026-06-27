ALTER TABLE "website"
ADD COLUMN "status_page_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "status_page_slug" TEXT;

CREATE UNIQUE INDEX "website_status_page_slug_key" ON "website"("status_page_slug");
