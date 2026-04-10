export type BradescoTrianonSignal = "C" | "D" | "*";

export type BradescoTrianonAssignment =
  | "ENTRADAS"
  | "SAÍDAS"
  | "IGNORAR"
  | "OUTROS";

export type BradescoTrianonAssignmentRule = {
  keyword: string;
  assignment: BradescoTrianonAssignment;
  signal: BradescoTrianonSignal;
};

export const bradescoTrianonAssignmentRules: BradescoTrianonAssignmentRule[] = [
  { keyword: "SALDO", assignment: "IGNORAR", signal: "*" },
  { keyword: "SERV", assignment: "SAÍDAS", signal: "D" },
  { keyword: "ENERGIA", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TRANSF.", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TRANSF.", assignment: "SAÍDAS", signal: "D" },
  { keyword: "TRANSF", assignment: "ENTRADAS", signal: "C" },
  { keyword: "TRANSFERENCIA", assignment: "ENTRADAS", signal: "C" },
  { keyword: "OP", assignment: "SAÍDAS", signal: "D" },
  { keyword: "RESERVA", assignment: "SAÍDAS", signal: "D" },
];
