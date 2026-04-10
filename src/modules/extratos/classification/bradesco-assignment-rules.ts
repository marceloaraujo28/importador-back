export type BradescoSignal = "C" | "D" | "*";

export type BradescoAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RESGATES"
  | "IGNORAR"
  | "OUTROS";

export type BradescoAssignmentRule = {
  keyword: string;
  assignment: BradescoAssignment;
  signal: BradescoSignal;
};

export const bradescoAssignmentRules: BradescoAssignmentRule[] = [
  { keyword: "APLICACAO", assignment: "APLICAÇÕES", signal: "D" },
  { keyword: "RECEBIMENTO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "RENTAB.INVEST", assignment: "ENTRADAS", signal: "C" },
  { keyword: "RESG/VENCTO", assignment: "RESGATES", signal: "C" },
  { keyword: "SALDO", assignment: "IGNORAR", signal: "*" },
  { keyword: "TARIFA", assignment: "TARIFAS", signal: "D" },
  { keyword: "TED", assignment: "SAÍDAS", signal: "D" },
];
