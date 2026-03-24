-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccountOpeningBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "referenceDate" TEXT,
    "initialAvailable" DECIMAL NOT NULL DEFAULT 0,
    "initialApplication" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountOpeningBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AccountOpeningBalance" ("accountId", "createdAt", "id", "initialApplication", "initialAvailable", "referenceDate", "updatedAt") SELECT "accountId", "createdAt", "id", "initialApplication", "initialAvailable", "referenceDate", "updatedAt" FROM "AccountOpeningBalance";
DROP TABLE "AccountOpeningBalance";
ALTER TABLE "new_AccountOpeningBalance" RENAME TO "AccountOpeningBalance";
CREATE UNIQUE INDEX "AccountOpeningBalance_accountId_key" ON "AccountOpeningBalance"("accountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
