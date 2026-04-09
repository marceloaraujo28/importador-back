-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccountDailySummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "entries" DECIMAL NOT NULL DEFAULT 0,
    "outputs" DECIMAL NOT NULL DEFAULT 0,
    "fees" DECIMAL NOT NULL DEFAULT 0,
    "yields" DECIMAL NOT NULL DEFAULT 0,
    "monthlyYields" DECIMAL NOT NULL DEFAULT 0,
    "rescues" DECIMAL NOT NULL DEFAULT 0,
    "applications" DECIMAL NOT NULL DEFAULT 0,
    "transferEcIn" DECIMAL NOT NULL DEFAULT 0,
    "transferEcOut" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountDailySummary_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AccountDailySummary" ("accountId", "applications", "createdAt", "dateKey", "entries", "fees", "id", "outputs", "rescues", "transferEcIn", "transferEcOut", "updatedAt", "yields") SELECT "accountId", "applications", "createdAt", "dateKey", "entries", "fees", "id", "outputs", "rescues", "transferEcIn", "transferEcOut", "updatedAt", "yields" FROM "AccountDailySummary";
DROP TABLE "AccountDailySummary";
ALTER TABLE "new_AccountDailySummary" RENAME TO "AccountDailySummary";
CREATE INDEX "AccountDailySummary_accountId_idx" ON "AccountDailySummary"("accountId");
CREATE INDEX "AccountDailySummary_dateKey_idx" ON "AccountDailySummary"("dateKey");
CREATE UNIQUE INDEX "AccountDailySummary_accountId_dateKey_key" ON "AccountDailySummary"("accountId", "dateKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
