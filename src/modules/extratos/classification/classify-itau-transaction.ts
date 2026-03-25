import {
  itauAssignmentRules,
  type ItauAssignment,
  type ItauSignal,
} from "./itau-assignment-rules";

type ClassifyItauTransactionInput = {
  description: string;
  signal: string;
};

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

function normalizeSignal(signal: string): ItauSignal | null {
  const normalizedSignal = normalizeText(signal);

  if (normalizedSignal === "C") return "C";
  if (normalizedSignal === "D") return "D";

  return null;
}

export function classifyItauTransaction(
  input: ClassifyItauTransactionInput,
): ItauAssignment {
  const firstWord = getFirstWord(input.description);
  const signal = normalizeSignal(input.signal);

  if (!firstWord || !signal) {
    return "OUTROS";
  }

  const exactRule = itauAssignmentRules.find((rule) => {
    return rule.keyword === firstWord && rule.signal === signal;
  });

  if (exactRule) {
    return exactRule.assignment;
  }

  return "OUTROS";
}
