import {
  ManualConsolidadoAssignment,
  ManualConsolidadoStatus,
  ManualConsolidadoTransferDirection,
} from "../../generated/prisma/client";

export const MANUAL_CONSOLIDADO_ASSIGNMENTS = [
  "ENTRADAS",
  "SAIDAS",
  "RESGATES",
  "APLICACOES",
  "TRANSFERENCIA_EC",
] as const;

export const MANUAL_CONSOLIDADO_STATUSES = [
  "AUTORIZADO",
  "NAO_AUTORIZADO",
] as const;

export const MANUAL_CONSOLIDADO_STATUS_FILTERS = [
  "AUTORIZADO",
  "NAO_AUTORIZADO",
  "TODOS",
] as const;

export const MANUAL_CONSOLIDADO_TRANSFER_DIRECTIONS = [
  "ENTRADA",
  "SAIDA",
] as const;

export type ManualConsolidadoAssignmentLabel =
  (typeof MANUAL_CONSOLIDADO_ASSIGNMENTS)[number];
export type ManualConsolidadoStatusLabel =
  (typeof MANUAL_CONSOLIDADO_STATUSES)[number];
export type ManualConsolidadoStatusFilter =
  (typeof MANUAL_CONSOLIDADO_STATUS_FILTERS)[number];
export type ManualConsolidadoTransferDirectionLabel =
  (typeof MANUAL_CONSOLIDADO_TRANSFER_DIRECTIONS)[number];

export function isManualConsolidadoAssignment(
  value: string,
): value is ManualConsolidadoAssignmentLabel {
  return MANUAL_CONSOLIDADO_ASSIGNMENTS.includes(
    value as ManualConsolidadoAssignmentLabel,
  );
}

export function isManualConsolidadoStatus(
  value: string,
): value is ManualConsolidadoStatusLabel {
  return MANUAL_CONSOLIDADO_STATUSES.includes(
    value as ManualConsolidadoStatusLabel,
  );
}

export function isManualConsolidadoStatusFilter(
  value: string,
): value is ManualConsolidadoStatusFilter {
  return MANUAL_CONSOLIDADO_STATUS_FILTERS.includes(
    value as ManualConsolidadoStatusFilter,
  );
}

export function isManualConsolidadoTransferDirection(
  value: string,
): value is ManualConsolidadoTransferDirectionLabel {
  return MANUAL_CONSOLIDADO_TRANSFER_DIRECTIONS.includes(
    value as ManualConsolidadoTransferDirectionLabel,
  );
}

export function mapAssignmentToPrisma(
  assignment: ManualConsolidadoAssignmentLabel,
): ManualConsolidadoAssignment {
  return assignment;
}

export function mapAssignmentFromPrisma(
  assignment: ManualConsolidadoAssignment,
): ManualConsolidadoAssignmentLabel {
  return assignment;
}

export function mapStatusToPrisma(
  status: ManualConsolidadoStatusLabel,
): ManualConsolidadoStatus {
  return status;
}

export function mapStatusFromPrisma(
  status: ManualConsolidadoStatus,
): ManualConsolidadoStatusLabel {
  return status;
}

export function mapStatusFilterToPrisma(
  status?: ManualConsolidadoStatusFilter,
): ManualConsolidadoStatus | undefined {
  if (!status || status === "TODOS") {
    return undefined;
  }

  return status;
}

export function mapTransferDirectionToPrisma(
  direction?: ManualConsolidadoTransferDirectionLabel | null,
): ManualConsolidadoTransferDirection | null {
  if (!direction) {
    return null;
  }

  return direction;
}

export function mapTransferDirectionFromPrisma(
  direction: ManualConsolidadoTransferDirection | null,
): ManualConsolidadoTransferDirectionLabel | null {
  return direction ?? null;
}
