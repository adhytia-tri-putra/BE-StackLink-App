ALTER TABLE "public"."users" ADD COLUMN "username" TEXT;
UPDATE "public"."users" SET "username" = CONCAT('user_', id) WHERE "username" IS NULL;
ALTER TABLE "public"."users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");