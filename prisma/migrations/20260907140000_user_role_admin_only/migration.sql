-- Collapse REVIEWER / APPROVER into ADMIN, then shrink the UserRole enum.

UPDATE "User"
SET "role" = 'ADMIN'
WHERE "role" IN ('REVIEWER', 'APPROVER');

CREATE TYPE "UserRole_new" AS ENUM ('CUSTOMER', 'ADMIN');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"UserRole_new"
      ELSE 'CUSTOMER'::"UserRole_new"
    END
  );

DROP TYPE "UserRole";

ALTER TYPE "UserRole_new" RENAME TO "UserRole";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER'::"UserRole";
