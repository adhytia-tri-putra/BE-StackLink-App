-- Existing raw addresses cannot be safely transformed without the application salt.
-- Remove them before all new click addresses are stored as one-way HMAC hashes.
UPDATE "link_clicks" SET "ip" = NULL WHERE "ip" IS NOT NULL;
