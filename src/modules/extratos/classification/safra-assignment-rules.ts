export type SafraSignal = "C" | "D" | "*";

export type SafraAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RENDIMENTOS"
  | "RESGATES"
  | "IGNORAR"
  | "OUTROS";

export type SafraAssignmentRule = {
  keyword: string;
  assignment: SafraAssignment;
  signal: SafraSignal;
};

export const safraAssignmentRules: SafraAssignmentRule[] = [
  { keyword: "AJUSTE", assignment: "SAÍDAS", signal: "D" },
  { keyword: "APLICACAO", assignment: "APLICAÇÕES", signal: "D" },
  { keyword: "CONTA", assignment: "IGNORAR", signal: "C" },
  { keyword: "ORDEM", assignment: "ENTRADAS", signal: "C" },
  { keyword: "PAGAMENTO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "PIX", assignment: "ENTRADAS", signal: "C" },
  { keyword: "RENDIMENTO", assignment: "RENDIMENTOS", signal: "C" },
  { keyword: "RESGATE", assignment: "RESGATES", signal: "C" },
  { keyword: "SALDO", assignment: "IGNORAR", signal: "C" },
  { keyword: "TAR", assignment: "TARIFAS", signal: "D" },
  { keyword: "TED", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TRANSF", assignment: "ENTRADAS", signal: "C" },
];
