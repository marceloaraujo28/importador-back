import {
  caixaAssignmentRules,
  type CaixaAssignment,
  type CaixaSignal,
} from "./caixa-assignment-rules";

type ClassifyCaixaTransactionInput = {
  description: string;
};

type ClassifyCaixaTransactionResult = {
  assignment: CaixaAssignment;
  signal: CaixaSignal;
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

export function classifyCaixaTransaction(
  input: ClassifyCaixaTransactionInput,
): ClassifyCaixaTransactionResult {
  const firstWord = getFirstWord(input.description);

  if (!firstWord) {
    return {
      assignment: "OUTROS",
      signal: "D",
    };
  }

  const rule = caixaAssignmentRules.find((item) => item.keyword === firstWord);

  if (!rule) {
    return {
      assignment: "OUTROS",
      signal: "D",
    };
  }

  return {
    assignment: rule.assignment,
    signal: rule.signal,
  };
}
