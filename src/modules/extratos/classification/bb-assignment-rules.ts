export type BbSignal = "C" | "D" | "*";

export type BbAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RESGATES"
  | "IGNORAR"
  | "OUTROS";

export type BbAssignmentRule = {
  keyword: string;
  assignment: BbAssignment;
  signal: BbSignal;
};

export const bbAssignmentRules: BbAssignmentRule[] = [
  { keyword: "COBRANCA", assignment: "ENTRADAS", signal: "C" },
  { keyword: "DEP", assignment: "ENTRADAS", signal: "C" },
  { keyword: "APLIC", assignment: "APLICAÇÕES", signal: "D" },
  { keyword: "BB", assignment: "APLICAÇÕES", signal: "D" },
  { keyword: "BB-ESCRITURACAO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "CHEQUE", assignment: "SAÍDAS", signal: "D" },
  { keyword: "DEBITO", assignment: "TARIFAS", signal: "D" },
  { keyword: "ESTORNO", assignment: "ENTRADAS", signal: "D" },
  { keyword: "FOLHA", assignment: "TARIFAS", signal: "D" },
  { keyword: "DEPOSITO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "IMPOSTOS", assignment: "TARIFAS", signal: "D" },
  { keyword: "PAGAMENTO", assignment: "TARIFAS", signal: "D" },
  { keyword: "PAGTO", assignment: "TARIFAS", signal: "D" },
  { keyword: "PIX", assignment: "TARIFAS", signal: "D" },
  { keyword: "DESBLOQUEIO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "OPERACOES", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TAR", assignment: "TARIFAS", signal: "D" },
  { keyword: "PIX", assignment: "ENTRADAS", signal: "C" },
  { keyword: "RECEBIMENTO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "RECEBIMENTOS", assignment: "ENTRADAS", signal: "C" },
  { keyword: "DEPOSITO", assignment: "IGNORAR", signal: "*" },
  { keyword: "RSG", assignment: "RESGATES", signal: "C" },
  { keyword: "SALDO", assignment: "IGNORAR", signal: "C" },
  { keyword: "TED", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED-ALUGUEL", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED-CREDITO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TED-IMPOSTOS", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED-OUTROS", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED-PAG", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED-PAGAMENTO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TRANSFERENCIA", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TRANSFERENCIA", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TRANSFERIDO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TRANSFERIDO", assignment: "ENTRADAS", signal: "C" },
];
