export type SantanderSignal = "C" | "D" | "*";

export type SantanderAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RESGATES"
  | "OUTROS";

export type SantanderAssignmentRule = {
  keyword: string;
  assignment: SantanderAssignment;
  signal: SantanderSignal;
};

export const santanderAssignmentRules: SantanderAssignmentRule[] = [
  { keyword: "TED ENVIADA", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TED", assignment: "ENTRADAS", signal: "C" },
  { keyword: "APLICACAO", assignment: "APLICAÇÕES", signal: "D" },
  { keyword: "ESTORNO", assignment: "APLICAÇÕES", signal: "C" },
  { keyword: "PIX", assignment: "ENTRADAS", signal: "C" },
  { keyword: "RESGATE", assignment: "RESGATES", signal: "C" },
  { keyword: "TARIFA", assignment: "TARIFAS", signal: "D" },
  { keyword: "VENCIMENTO", assignment: "RESGATES", signal: "C" },
  { keyword: "TOTAL", assignment: "OUTROS", signal: "*" },
];
