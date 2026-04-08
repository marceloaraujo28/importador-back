export type SupportedBankName =
  | "BANCO DO BRASIL"
  | "BANCO ITAÚ"
  | "CAIXA ECONÔMICA FEDERAL"
  | "BANCO SAFRA"
  | "BANCO SANTANDER"
  | "BANCO BRADESCO"
  | "BANCO BRADESCO TRIANON";

export type AccountConfig = {
  accountId: string;
  bankName: SupportedBankName;
  companyName: string;
};

export const accountConfigMap: Record<string, AccountConfig> = {
  VV02: {
    accountId: "VV02",
    bankName: "BANCO DO BRASIL",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  VV03: {
    accountId: "VV03",
    bankName: "BANCO DO BRASIL",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  VV04: {
    accountId: "VV04",
    bankName: "BANCO DO BRASIL",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  VV07: {
    accountId: "VV07",
    bankName: "CAIXA ECONÔMICA FEDERAL",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  VV09: {
    accountId: "VV09",
    bankName: "BANCO ITAÚ",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  VV10: {
    accountId: "VV10",
    bankName: "BANCO ITAÚ",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  VV14: {
    accountId: "VV14",
    bankName: "BANCO SAFRA",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  VV15: {
    accountId: "VV15",
    bankName: "BANCO SANTANDER",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },

  PNR1: {
    accountId: "PNR1",
    bankName: "BANCO DO BRASIL",
    companyName: "Usina Panorama S/A",
  },
  PNR2: {
    accountId: "PNR2",
    bankName: "BANCO DO BRASIL",
    companyName: "Usina Panorama S/A",
  },
  PNR4: {
    accountId: "PNR4",
    bankName: "BANCO ITAÚ",
    companyName: "Usina Panorama S/A",
  },
  PNR5: {
    accountId: "PNR5",
    bankName: "BANCO SAFRA",
    companyName: "Usina Panorama S/A",
  },
  PNR6: {
    accountId: "PNR6",
    bankName: "BANCO SANTANDER",
    companyName: "Usina Panorama S/A",
  },
  PNR8: {
    accountId: "PNR8",
    bankName: "BANCO DO BRASIL",
    companyName: "Usina Panorama S/A",
  },

  FSA1: {
    accountId: "FSA1",
    bankName: "BANCO DO BRASIL",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  FSA2: {
    accountId: "FSA2",
    bankName: "BANCO DO BRASIL",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  FSA3: {
    accountId: "FSA3",
    bankName: "BANCO ITAÚ",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  FSA4: {
    accountId: "FSA4",
    bankName: "BANCO BRADESCO",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  FSA5: {
    accountId: "FSA5",
    bankName: "BANCO SAFRA",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  FSA6: {
    accountId: "FSA6",
    bankName: "BANCO SANTANDER",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  FSA7: {
    accountId: "FSA7",
    bankName: "BANCO ITAÚ",
    companyName: "Floresta S/A Açúcar e Álcool",
  },

  CAM1: {
    accountId: "CAM1",
    bankName: "BANCO DO BRASIL",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },
  CAM2: {
    accountId: "CAM2",
    bankName: "BANCO ITAÚ",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },
  CAM3: {
    accountId: "CAM3",
    bankName: "BANCO DO BRASIL",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },
  CAM5: {
    accountId: "CAM5",
    bankName: "BANCO SAFRA",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },
  CAM7: {
    accountId: "CAM7",
    bankName: "BANCO SANTANDER",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },

  PRI1: {
    accountId: "PRI1",
    bankName: "BANCO DO BRASIL",
    companyName: "Agropecuária Primavera",
  },
  PRI2: {
    accountId: "PRI2",
    bankName: "BANCO ITAÚ",
    companyName: "Agropecuária Primavera",
  },
  PRI3: {
    accountId: "PRI3",
    bankName: "BANCO DO BRASIL",
    companyName: "Agropecuária Primavera",
  },

  FLA1: {
    accountId: "FLA1",
    bankName: "BANCO DO BRASIL",
    companyName: "Floresta Agrícola LTDA",
  },
  FLA2: {
    accountId: "FLA2",
    bankName: "BANCO ITAÚ",
    companyName: "Floresta Agrícola LTDA",
  },

  EE01: {
    accountId: "EE01",
    bankName: "BANCO DO BRASIL",
    companyName: "Energética Entre Rios",
  },
  EE02: {
    accountId: "EE02",
    bankName: "BANCO ITAÚ",
    companyName: "Energética Entre Rios",
  },
  EE03: {
    accountId: "EE03",
    bankName: "BANCO BRADESCO TRIANON",
    companyName: "Energética Entre Rios",
  },

  EC01: {
    accountId: "EC01",
    bankName: "BANCO DO BRASIL",
    companyName: "Energética Cambuí",
  },
  EC02: {
    accountId: "EC02",
    bankName: "BANCO ITAÚ",
    companyName: "Energética Cambuí",
  },
  EC03: {
    accountId: "EC03",
    bankName: "BANCO BRADESCO TRIANON",
    companyName: "Energética Cambuí",
  },
};

export function getAccountConfig(accountId: string): AccountConfig | null {
  return accountConfigMap[accountId.toUpperCase()] ?? null;
}
