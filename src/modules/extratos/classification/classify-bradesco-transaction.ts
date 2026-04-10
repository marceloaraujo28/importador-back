import {
  bradescoAssignmentRules,
  type BradescoAssignment,
  type BradescoSignal,
} from "./bradesco-assignment-rules";

type ClassifyBradescoTransactionInput = {
  description: string;
  signal: string;
};

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeSignal(signal: string): BradescoSignal | null {
  const normalizedSignal = normalizeText(signal);

  if (normalizedSignal === "C") return "C";
  if (normalizedSignal === "D") return "D";

  return null;
}

export function classifyBradescoTransaction(
  input: ClassifyBradescoTransactionInput,
): BradescoAssignment {
  const normalizedDescription = normalizeText(input.description);
  const signal = normalizeSignal(input.signal);

  if (!normalizedDescription || !signal) {
    return "OUTROS";
  }

  const exactRule = bradescoAssignmentRules.find((rule) => {
    return (
      normalizedDescription.startsWith(rule.keyword) && rule.signal === signal
    );
  });

  if (exactRule) {
    return exactRule.assignment;
  }

  const wildcardRule = bradescoAssignmentRules.find((rule) => {
    return (
      normalizedDescription.startsWith(rule.keyword) && rule.signal === "*"
    );
  });

  if (wildcardRule) {
    return wildcardRule.assignment;
  }

  return "OUTROS";
}
