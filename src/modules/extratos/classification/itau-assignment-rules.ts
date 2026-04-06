export type ItauSignal = "C" | "D";

export type ItauAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RESGATES"
  | "RENDIMENTOS"
  | "IGNORAR"
  | "OUTROS";

export type ItauAssignmentRule = {
  keyword: string;
  assignment: ItauAssignment;
  signal: ItauSignal;
};

export const itauAssignmentRules: ItauAssignmentRule[] = [
  { keyword: "AG.", assignment: "ENTRADAS", signal: "C" },
  { keyword: "APLICACAO", assignment: "APLICAÇÕES", signal: "D" },
  { keyword: "BOLETO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "CH", assignment: "SAÍDAS", signal: "D" },
  { keyword: "DA", assignment: "SAÍDAS", signal: "D" },
  { keyword: "DEBITO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "DEP", assignment: "ENTRADAS", signal: "C" },
  { keyword: "DEV", assignment: "SAÍDAS", signal: "C" },
  { keyword: "DI", assignment: "APLICAÇÕES", signal: "D" },
  { keyword: "DIVIDENDOS", assignment: "ENTRADAS", signal: "C" },
  { keyword: "ENTRADA", assignment: "RENDIMENTOS", signal: "C" },
  { keyword: "EST", assignment: "SAÍDAS", signal: "C" },
  { keyword: "ESTORNO", assignment: "RESGATES", signal: "D" },
  { keyword: "FRACAO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "JR", assignment: "ENTRADAS", signal: "C" },
  { keyword: "LANCAMENTO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "PAGAMENTO", assignment: "SAÍDAS", signal: "D" },
  { keyword: "PAGAMENTOS", assignment: "SAÍDAS", signal: "D" },
  { keyword: "PAGTO", assignment: "ENTRADAS", signal: "C" },
  { keyword: "PARC", assignment: "SAÍDAS", signal: "D" },
  { keyword: "PIX", assignment: "ENTRADAS", signal: "C" },
  { keyword: "PIX", assignment: "SAÍDAS", signal: "D" },
  { keyword: "RECEBIMENTOS", assignment: "ENTRADAS", signal: "C" },
  { keyword: "REND", assignment: "RENDIMENTOS", signal: "C" },
  { keyword: "RENDIMENTO", assignment: "RENDIMENTOS", signal: "C" },
  { keyword: "RENDIMENTOS", assignment: "RENDIMENTOS", signal: "C" },
  { keyword: "RESGATE", assignment: "RESGATES", signal: "C" },
  { keyword: "SAÍDA", assignment: "SAÍDAS", signal: "D" },
  { keyword: "SAQ", assignment: "SAÍDAS", signal: "D" },
  { keyword: "SISPAG", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TAR", assignment: "TARIFAS", signal: "D" },
  { keyword: "TAXA", assignment: "TARIFAS", signal: "D" },
  { keyword: "TEC", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TED", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TRANSFERENCIA", assignment: "SAÍDAS", signal: "D" },
  { keyword: "VENCIMENTO", assignment: "RESGATES", signal: "C" },
];
