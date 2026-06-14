ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN "suspended_at" TIMESTAMP(3);

CREATE TABLE "abuse_reports" (
  "id" TEXT NOT NULL,
  "user_id" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "abuse_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "abuse_reports_status_created_at_idx" ON "abuse_reports"("status", "created_at");
ALTER TABLE "abuse_reports" ADD CONSTRAINT "abuse_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
