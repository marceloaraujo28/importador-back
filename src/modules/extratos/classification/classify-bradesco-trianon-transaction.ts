import {
  bradescoTrianonAssignmentRules,
  type BradescoTrianonAssignment,
  type BradescoTrianonSignal,
} from "./bradesco-trianon-assignment-rules";

type ClassifyBradescoTrianonTransactionInput = {
  description: string;
  signal: string;
};

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeSignal(signal: string): BradescoTrianonSignal | null {
  const normalizedSignal = normalizeText(signal);

  if (normalizedSignal === "C") return "C";
  if (normalizedSignal === "D") return "D";

  return null;
}

export function classifyBradescoTrianonTransaction(
  input: ClassifyBradescoTrianonTransactionInput,
): BradescoTrianonAssignment {
  const normalizedDescription = normalizeText(input.description);
  const signal = normalizeSignal(input.signal);

  if (!normalizedDescription || !signal) {
    return "OUTROS";
  }

  const exactRule = bradescoTrianonAssignmentRules.find((rule) => {
    return (
      normalizedDescription.startsWith(normalizeText(rule.keyword)) &&
      rule.signal === signal
    );
  });

  if (exactRule) {
    return exactRule.assignment;
  }

  const wildcardRule = bradescoTrianonAssignmentRules.find((rule) => {
    return (
      normalizedDescription.startsWith(normalizeText(rule.keyword)) &&
      rule.signal === "*"
    );
  });

  if (wildcardRule) {
    return wildcardRule.assignment;
  }

  return "OUTROS";
}
