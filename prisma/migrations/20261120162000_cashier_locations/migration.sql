BEGIN;

ALTER TABLE "user" ADD COLUMN "cashierLocationId" TEXT;
ALTER TABLE "StampTransaction" ADD COLUMN "locationId" TEXT;

CREATE INDEX "user_cashierLocationId_idx" ON "user"("cashierLocationId");
CREATE INDEX "StampTransaction_cafeId_locationId_idx" ON "StampTransaction"("cafeId", "locationId");

ALTER TABLE "user" ADD CONSTRAINT "user_cashierLocationId_fkey"
    FOREIGN KEY ("cashierLocationId") REFERENCES "CafeLocation"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StampTransaction" ADD CONSTRAINT "StampTransaction_cafeId_locationId_fkey"
    FOREIGN KEY ("cafeId", "locationId") REFERENCES "CafeLocation"("cafeId", "id")
    ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT;
