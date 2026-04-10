import {
  santanderAssignmentRules,
  type SantanderAssignment,
  type SantanderSignal,
} from "./santander-assignment-rules";

type ClassifySantanderTransactionInput = {
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

function normalizeSignal(signal: string): SantanderSignal | null {
  const normalizedSignal = normalizeText(signal);

  if (normalizedSignal === "C") return "C";
  if (normalizedSignal === "D") return "D";

  return null;
}

export function classifySantanderTransaction(
  input: ClassifySantanderTransactionInput,
): SantanderAssignment {
  const normalizedDescription = normalizeText(input.description);
  const signal = normalizeSignal(input.signal);

  if (!normalizedDescription || !signal) {
    return "OUTROS";
  }

  const exactRule = santanderAssignmentRules.find((rule) => {
    return (
      normalizedDescription.startsWith(rule.keyword) && rule.signal === signal
    );
  });

  if (exactRule) {
    return exactRule.assignment;
  }

  const wildcardRule = santanderAssignmentRules.find((rule) => {
    return (
      normalizedDescription.startsWith(rule.keyword) && rule.signal === "*"
    );
  });

  if (wildcardRule) {
    return wildcardRule.assignment;
  }

  return "OUTROS";
}
