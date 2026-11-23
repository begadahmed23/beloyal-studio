ALTER TABLE "Cafe" ADD COLUMN "storeLimit" INTEGER NOT NULL DEFAULT 1;

UPDATE "Cafe" c
SET "storeLimit" = GREATEST(
  1,
  (SELECT count(*) FROM "CafeLocation" l WHERE l."cafeId" = c.id AND l."archivedAt" IS NULL),
  (SELECT count(*) FROM "user" u WHERE u.role = 'CASHIER'
    AND COALESCE(u."staffCafeId", u."cashierCafeId", u."cafeId") = c.id)
);

ALTER TABLE "Cafe" ADD CONSTRAINT "Cafe_storeLimit_positive" CHECK ("storeLimit" >= 1);
