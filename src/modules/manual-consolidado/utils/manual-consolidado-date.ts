type NormalizedManualConsolidadoDate = {
  date: string;
  dateKey: string;
};

function normalizeYear(yearText: string): string {
  if (yearText.length === 4) {
    return yearText;
  }

  const year = Number(yearText);

  if (Number.isNaN(year)) {
    throw new Error(`Ano invalido recebido: ${yearText}`);
  }

  return year >= 70 ? `19${yearText}` : `20${yearText}`;
}

export function normalizeManualConsolidadoDate(
  input: string,
): NormalizedManualConsolidadoDate {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("A data e obrigatoria.");
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return {
      date: `${day}/${month}/${year}`,
      dateKey: `${year}-${month}-${day}`,
    };
  }

  const ptBrMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

  if (ptBrMatch) {
    const [, dayText, monthText, yearText] = ptBrMatch;
    const day = String(Number(dayText)).padStart(2, "0");
    const month = String(Number(monthText)).padStart(2, "0");
    const year = normalizeYear(yearText);

    return {
      date: `${day}/${month}/${year}`,
      dateKey: `${year}-${month}-${day}`,
    };
  }

  throw new Error(`Data invalida recebida: ${input}`);
}
