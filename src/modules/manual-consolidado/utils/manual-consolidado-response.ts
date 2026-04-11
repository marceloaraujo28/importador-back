import type { Account, Company, ManualConsolidadoEntry } from "../../../generated/prisma/client";
import {
  mapAssignmentFromPrisma,
  mapStatusFromPrisma,
  mapTransferDirectionFromPrisma,
} from "../manual-consolidado.types";
import { toNumber } from "./manual-consolidado-number";

type EntryWithAccount = ManualConsolidadoEntry & {
  account: Account & {
    company: Company;
  };
};

export function mapManualConsolidadoEntryResponse(entry: EntryWithAccount) {
  return {
    id: entry.id,
    accountId: entry.account.code,
    companyName: entry.account.company.name,
    date: entry.date,
    dateKey: entry.dateKey,
    amount: toNumber(entry.amount),
    description: entry.description,
    assignment: mapAssignmentFromPrisma(entry.assignment),
    transferDirection: mapTransferDirectionFromPrisma(entry.transferDirection),
    status: mapStatusFromPrisma(entry.status),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
