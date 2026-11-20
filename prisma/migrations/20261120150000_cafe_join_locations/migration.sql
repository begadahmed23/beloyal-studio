BEGIN;

CREATE TABLE "CafeLocation" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "CafeLocation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Customer" ADD COLUMN "joinLocationId" TEXT;

CREATE UNIQUE INDEX "CafeLocation_cafeId_id_key" ON "CafeLocation"("cafeId", "id");
CREATE UNIQUE INDEX "CafeLocation_cafeId_name_key" ON "CafeLocation"("cafeId", "name");
CREATE INDEX "Customer_cafeId_joinLocationId_idx" ON "Customer"("cafeId", "joinLocationId");

ALTER TABLE "CafeLocation" ADD CONSTRAINT "CafeLocation_cafeId_fkey"
    FOREIGN KEY ("cafeId") REFERENCES "Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_cafeId_joinLocationId_fkey"
    FOREIGN KEY ("cafeId", "joinLocationId") REFERENCES "CafeLocation"("cafeId", "id")
    ON DELETE NO ACTION ON UPDATE CASCADE;

INSERT INTO "CafeLocation" ("id", "cafeId", "name")
SELECT location.id, cafe."id", location.name
FROM "Cafe" AS cafe
CROSS JOIN (VALUES
    ('mblocationheliopolis', 'فرع مصر الجديدة'),
    ('mblocationzeitoun', 'فرع الزيتون')
) AS location(id, name)
WHERE cafe."slug" = 'mb-vape' AND cafe."businessType" = 'VAPE'
ON CONFLICT ("cafeId", "name") DO NOTHING;

COMMIT;
