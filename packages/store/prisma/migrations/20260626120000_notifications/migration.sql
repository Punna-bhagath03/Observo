CREATE TYPE "notification_channel_type" AS ENUM ('email');

CREATE TYPE "incident_event_type" AS ENUM (
  'incident_opened',
  'incident_acknowledged',
  'incident_resolved'
);

CREATE TABLE "notification_channel" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "notification_channel_type" NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Email',
  "config" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "notification_channel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_rule" (
  "id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "event_type" "incident_event_type" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "notification_rule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_delivery" (
  "id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "incident_id" TEXT NOT NULL,
  "event_type" "incident_event_type" NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_channel_user_id_idx" ON "notification_channel"("user_id");

CREATE UNIQUE INDEX "notification_rule_channel_id_event_type_key"
  ON "notification_rule"("channel_id", "event_type");

CREATE UNIQUE INDEX "notification_delivery_channel_id_incident_id_event_type_key"
  ON "notification_delivery"("channel_id", "incident_id", "event_type");

ALTER TABLE "notification_channel"
ADD CONSTRAINT "notification_channel_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_rule"
ADD CONSTRAINT "notification_rule_channel_id_fkey"
FOREIGN KEY ("channel_id") REFERENCES "notification_channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_delivery"
ADD CONSTRAINT "notification_delivery_channel_id_fkey"
FOREIGN KEY ("channel_id") REFERENCES "notification_channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_delivery"
ADD CONSTRAINT "notification_delivery_incident_id_fkey"
FOREIGN KEY ("incident_id") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
