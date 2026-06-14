ALTER TABLE "users"
ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN "plan_status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "billing_customer_id" TEXT;

CREATE UNIQUE INDEX "users_billing_customer_id_key" ON "users"("billing_customer_id");
