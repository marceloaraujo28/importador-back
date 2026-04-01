/*
  Warnings:

  - Added the required column `dateKey` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "signal" TEXT NOT NULL,
    "assignment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "assignment", "createdAt", "date", "description", "id", "signal", "updatedAt") SELECT "accountId", "amount", "assignment", "createdAt", "date", "description", "id", "signal", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX "Transaction_dateKey_idx" ON "Transaction"("dateKey");
CREATE INDEX "Transaction_assignment_idx" ON "Transaction"("assignment");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
