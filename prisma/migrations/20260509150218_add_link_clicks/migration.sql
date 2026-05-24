-- CreateTable
CREATE TABLE "public"."link_clicks" (
    "id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_clicks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."link_clicks" ADD CONSTRAINT "link_clicks_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
