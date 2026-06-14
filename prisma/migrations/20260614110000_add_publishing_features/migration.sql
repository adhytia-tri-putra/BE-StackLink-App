ALTER TABLE "users"
ADD COLUMN "seo_title" TEXT,
ADD COLUMN "seo_description" TEXT,
ADD COLUMN "social_image" TEXT,
ADD COLUMN "custom_domain" TEXT,
ADD COLUMN "google_analytics_id" TEXT,
ADD COLUMN "meta_pixel_id" TEXT,
ADD COLUMN "tiktok_pixel_id" TEXT;

CREATE UNIQUE INDEX "users_custom_domain_key" ON "users"("custom_domain");

ALTER TABLE "links"
ADD COLUMN "starts_at" TIMESTAMP(3),
ADD COLUMN "ends_at" TIMESTAMP(3);
