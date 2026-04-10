export type CaixaSignal = "C" | "D";

export type CaixaAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "RESGATES"
  | "IGNORAR"
  | "OUTROS";

export type CaixaAssignmentRule = {
  keyword: string;
  assignment: CaixaAssignment;
  signal: CaixaSignal;
};

export const caixaAssignmentRules: CaixaAssignmentRule[] = [
  { keyword: "CREDITO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "DEB.AUTOR.", assignment: "SAÍDAS", signal: "D" },
  { keyword: "DEBITO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "DOC/TED", assignment: "TARIFAS", signal: "D" },
  { keyword: "ENVIO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "MANUT", assignment: "TARIFAS", signal: "D" },
  { keyword: "PAG", assignment: "SAÍDAS", signal: "D" },
  { keyword: "PG", assignment: "SAÍDAS", signal: "D" },
  { keyword: "RG", assignment: "RESGATES", signal: "C" },
  { keyword: "TARIFA", assignment: "TARIFAS", signal: "D" },
  { keyword: "VENC", assignment: "RESGATES", signal: "C" },
];
