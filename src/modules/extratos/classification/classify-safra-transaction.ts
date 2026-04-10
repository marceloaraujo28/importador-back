import {
  safraAssignmentRules,
  type SafraAssignment,
  type SafraSignal,
} from "./safra-assignment-rules";

type ClassifySafraTransactionInput = {
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

function getFirstWord(description: string): string {
  const normalizedDescription = normalizeText(description);

  if (!normalizedDescription) {
    return "";
  }

  const [firstWord = ""] = normalizedDescription.split(/\s+/);
  return firstWord;
}

function normalizeSignal(signal: string): SafraSignal | null {
  const normalizedSignal = normalizeText(signal);

  if (normalizedSignal === "C") return "C";
  if (normalizedSignal === "D") return "D";

  return null;
}

export function classifySafraTransaction(
  input: ClassifySafraTransactionInput,
): SafraAssignment {
  const firstWord = getFirstWord(input.description);
  const signal = normalizeSignal(input.signal);

  if (!firstWord || !signal) {
    return "OUTROS";
  }

  const exactRule = safraAssignmentRules.find((rule) => {
    return rule.keyword === firstWord && rule.signal === signal;
  });

  if (exactRule) {
    return exactRule.assignment;
  }

  const wildcardRule = safraAssignmentRules.find((rule) => {
    return rule.keyword === firstWord && rule.signal === "*";
  });

  if (wildcardRule) {
    return wildcardRule.assignment;
  }

  return "OUTROS";
}
