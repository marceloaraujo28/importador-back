/*
  Warnings:

  - Added the required column `groupId` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CompanyGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccountOpeningBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "referenceDate" TEXT NOT NULL,
    "initialAvailable" DECIMAL NOT NULL DEFAULT 0,
    "initialApplication" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountOpeningBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountDailySummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "entries" DECIMAL NOT NULL DEFAULT 0,
    "outputs" DECIMAL NOT NULL DEFAULT 0,
    "fees" DECIMAL NOT NULL DEFAULT 0,
    "yields" DECIMAL NOT NULL DEFAULT 0,
    "rescues" DECIMAL NOT NULL DEFAULT 0,
    "applications" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountDailySummary_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CompanyGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
CREATE INDEX "Company_groupId_idx" ON "Company"("groupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyGroup_name_key" ON "CompanyGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AccountOpeningBalance_accountId_key" ON "AccountOpeningBalance"("accountId");

-- CreateIndex
CREATE INDEX "AccountDailySummary_accountId_idx" ON "AccountDailySummary"("accountId");

-- CreateIndex
CREATE INDEX "AccountDailySummary_dateKey_idx" ON "AccountDailySummary"("dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDailySummary_accountId_dateKey_key" ON "AccountDailySummary"("accountId", "dateKey");
