export function parsePtBrDateToDateKey(date: string): string {
  const [day, month, year] = date.split("/").map(Number);

  if (!day || !month || !year) {
    throw new Error(`Data inválida recebida: ${date}`);
  }

  const normalizedMonth = String(month).padStart(2, "0");
  const normalizedDay = String(day).padStart(2, "0");

  return `${year}-${normalizedMonth}-${normalizedDay}`;
}
