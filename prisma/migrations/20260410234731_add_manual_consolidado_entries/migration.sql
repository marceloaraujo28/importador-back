-- CreateTable
CREATE TABLE "ManualConsolidadoEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "assignment" TEXT NOT NULL,
    "transferDirection" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NAO_AUTORIZADO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManualConsolidadoEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ManualConsolidadoEntry_accountId_idx" ON "ManualConsolidadoEntry"("accountId");

-- CreateIndex
CREATE INDEX "ManualConsolidadoEntry_date_idx" ON "ManualConsolidadoEntry"("date");

-- CreateIndex
CREATE INDEX "ManualConsolidadoEntry_dateKey_idx" ON "ManualConsolidadoEntry"("dateKey");

-- CreateIndex
CREATE INDEX "ManualConsolidadoEntry_assignment_idx" ON "ManualConsolidadoEntry"("assignment");

-- CreateIndex
CREATE INDEX "ManualConsolidadoEntry_status_idx" ON "ManualConsolidadoEntry"("status");
