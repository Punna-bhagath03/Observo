ALTER TABLE "incident"
ADD COLUMN "acknowledged_at" TIMESTAMP(3),
ADD COLUMN "acknowledged_by_user_id" TEXT,
ADD COLUMN "resolved_by_user_id" TEXT;

ALTER TABLE "incident"
ADD CONSTRAINT "incident_acknowledged_by_user_id_fkey"
FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "incident"
ADD CONSTRAINT "incident_resolved_by_user_id_fkey"
FOREIGN KEY ("resolved_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
