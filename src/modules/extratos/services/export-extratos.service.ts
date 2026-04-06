import XLSX from "xlsx";

import { prisma } from "../../../lib/prisma";
import { TransactionAssignment } from "../../../generated/prisma/client";

type ExportExtratosInput = {
  assignment?:
    | "ENTRADAS"
    | "SAÍDAS"
    | "TARIFAS"
    | "APLICAÇÕES"
    | "RENDIMENTOS"
    | "RESGATES"
    | "TRANSFERÊNCIA EC"
    | "OUTROS";
  dateFrom?: string;
  dateTo?: string;
  dateOrder: "asc" | "desc";
};

type ExportRow = {
  "ID Conta": string;
  Banco: string;
  Data: string;
  Histórico: string;
  Valor: number;
  Atribuição:
    | "ENTRADAS"
    | "SAÍDAS"
    | "TARIFAS"
    | "APLICAÇÕES"
    | "RENDIMENTOS"
    | "RESGATES"
    | "TRANSFERÊNCIA EC"
    | "OUTROS";
};

function mapAssignmentFromPrisma(
  assignment: TransactionAssignment,
):
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RENDIMENTOS"
  | "RESGATES"
  | "TRANSFERÊNCIA EC"
  | "OUTROS" {
  switch (assignment) {
    case "ENTRADAS":
      return "ENTRADAS";
    case "SAIDAS":
      return "SAÍDAS";
    case "TARIFAS":
      return "TARIFAS";
    case "APLICACOES":
      return "APLICAÇÕES";
    case "RENDIMENTOS":
      return "RENDIMENTOS";
    case "RESGATES":
      return "RESGATES";
    case "TRANSFERENCIA_EC":
      return "TRANSFERÊNCIA EC";
    default:
      return "OUTROS";
  }
}

function mapAssignmentToPrisma(
  assignment: ExportExtratosInput["assignment"],
): TransactionAssignment | undefined {
  switch (assignment) {
    case "ENTRADAS":
      return "ENTRADAS";
    case "SAÍDAS":
      return "SAIDAS";
    case "TARIFAS":
      return "TARIFAS";
    case "APLICAÇÕES":
      return "APLICACOES";
    case "RENDIMENTOS":
      return "RENDIMENTOS";
    case "RESGATES":
      return "RESGATES";
    case "TRANSFERÊNCIA EC":
      return "TRANSFERENCIA_EC";
    case "OUTROS":
      return "OUTROS";
    default:
      return undefined;
  }
}

function isNegativeAssignment(assignment: ExportRow["Atribuição"]) {
  return (
    assignment === "SAÍDAS" ||
    assignment === "TARIFAS" ||
    assignment === "APLICAÇÕES"
  );
}

function isPositiveAssignment(assignment: ExportRow["Atribuição"]) {
  return (
    assignment === "ENTRADAS" ||
    assignment === "RESGATES" ||
    assignment === "RENDIMENTOS" ||
    assignment === "TRANSFERÊNCIA EC"
  );
}

export async function exportExtratos(input: ExportExtratosInput) {
  const mappedAssignment = mapAssignmentToPrisma(input.assignment);

  const where = {
    ...(mappedAssignment ? { assignment: mappedAssignment } : {}),
    ...(input.dateFrom || input.dateTo
      ? {
          dateKey: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {}),
          },
        }
      : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: [{ dateKey: input.dateOrder }, { createdAt: "desc" }],
    include: {
      account: {
        include: {
          company: true,
        },
      },
    },
  });

  const rows: ExportRow[] = transactions.map((transaction) => ({
    "ID Conta": transaction.account.code,
    Banco: transaction.account.bankName,
    Data: transaction.date,
    Histórico: transaction.description,
    Valor: Number(transaction.amount),
    Atribuição: mapAssignmentFromPrisma(transaction.assignment),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 14 },
    { wch: 40 },
    { wch: 16 },
    { wch: 20 },
  ];

  worksheet["!autofilter"] = {
    ref: `A1:F${rows.length + 1}`,
  };

  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1:F1");

  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    if (!cell) continue;

    cell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F2937" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "D1D5DB" } },
        bottom: { style: "thin", color: { rgb: "D1D5DB" } },
        left: { style: "thin", color: { rgb: "D1D5DB" } },
        right: { style: "thin", color: { rgb: "D1D5DB" } },
      },
    };
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const excelRow = rowIndex + 1;

    const valueCellAddress = XLSX.utils.encode_cell({ r: excelRow, c: 4 });
    const assignmentCellAddress = XLSX.utils.encode_cell({ r: excelRow, c: 5 });

    const valueCell = worksheet[valueCellAddress];
    const assignmentCell = worksheet[assignmentCellAddress];
    const row = rows[rowIndex];
    if (!row) continue;

    const assignment = row["Atribuição"];
    const fontColor = isNegativeAssignment(assignment)
      ? "DC2626"
      : isPositiveAssignment(assignment)
        ? "059669"
        : "111827";

    if (valueCell) {
      valueCell.z = "R$ #,##0.00";
      valueCell.s = {
        font: { color: { rgb: fontColor } },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };
    }

    if (assignmentCell) {
      assignmentCell.s = {
        font: {
          bold: true,
          color: { rgb: fontColor },
        },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };
    }

    for (let col = 0; col <= 3; col += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: excelRow, c: col });
      const cell = worksheet[cellAddress];
      if (!cell) continue;

      cell.s = {
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, "Extratos");

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
    cellStyles: true,
  });

  return buffer;
}
