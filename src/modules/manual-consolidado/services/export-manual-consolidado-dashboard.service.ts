import XLSX from "xlsx";
import { listManualConsolidadoDashboard } from "./list-manual-consolidado-dashboard.service";
import type { ManualConsolidadoStatusFilter } from "../manual-consolidado.types";
import { compareByAccountDisplayOrder } from "../utils/account-display-order";

type ExportManualConsolidadoDashboardInput = {
  accountIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  status?: ManualConsolidadoStatusFilter;
};

type ExportRow = {
  "ID Conta": string;
  Empresa: string;
  "Data Referência": string;
  "Saldo Inicial": number;
  Entradas: number;
  Saídas: number;
  Resgates: number;
  Aplicações: number;
  "Transferência entre Contas": number;
  Total: number;
};

export async function exportManualConsolidadoDashboard(
  input: ExportManualConsolidadoDashboardInput,
) {
  const result = await listManualConsolidadoDashboard(input);
  const orderedRows = [...result.rows].sort(compareByAccountDisplayOrder);

  const rows: ExportRow[] = orderedRows.map((row) => ({
    "ID Conta": row.accountId,
    Empresa: row.companyName,
    "Data Referência": row.referenceDate ?? "-",
    "Saldo Inicial": row.initialBalance,
    Entradas: row.entries,
    Saídas: row.outputs,
    Resgates: row.rescues,
    Aplicações: row.applications,
    "Transferência entre Contas": row.transferBetweenAccounts,
    Total: row.total,
  }));

  rows.push({
    "ID Conta": "Totais",
    Empresa: "-",
    "Data Referência": "-",
    "Saldo Inicial": result.totals.initialBalance,
    Entradas: result.totals.entries,
    Saídas: result.totals.outputs,
    Resgates: result.totals.rescues,
    Aplicações: result.totals.applications,
    "Transferência entre Contas": result.totals.transferBetweenAccounts,
    Total: result.totals.total,
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 26 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Manual");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });
}
