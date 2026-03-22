export type SupportedBankName =
  | "BANCO DO BRASIL"
  | "BANCO ITAÚ"
  | "CAIXA ECONÔMICA FEDERAL"
  | "BANCO SAFRA"
  | "BANCO SANTANDER"
  | "BANCO BRADESCO";

export type AccountConfig = {
  accountId: string;
  bankName: SupportedBankName;
  companyName: string;
};

export const accountConfigMap: Record<string, AccountConfig> = {
  //aqui fica as congigurações de cada conta, o accountId é o nome do arquivo do extrato sem a extensão
  //exemplo:
  "EXTRATO-ITAU": {
    accountId: "EXTRATO-ITAU",
    bankName: "BANCO ITAÚ",
    companyName: "Empresa XYZ",
  },
};

export function getAccountConfig(accountId: string): AccountConfig | null {
  return accountConfigMap[accountId.toUpperCase()] ?? null;
}
