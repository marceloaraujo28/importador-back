export function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return Number(value.toString());
  }

  return Number(value ?? 0);
}

export function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}
