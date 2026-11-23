-- Preserve the existing businesses that use purchase tracking and enable Gourmeal.
ALTER TABLE "Cafe" ADD COLUMN "spendingTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Cafe"
SET "spendingTrackingEnabled" = true
WHERE lower("slug") IN ('goumeal', 'gourmeal', 'mb-vape', 'loretto')
   OR "name" ILIKE '%loretto%';

ALTER TABLE "Cafe" ALTER COLUMN "spendingTrackingEnabled" SET DEFAULT true;
