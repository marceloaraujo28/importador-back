import { prisma } from "../src/lib/prisma";

type SeedAccount = {
  code: string;
  bankName: string;
  companyName: string;
};

const accounts: SeedAccount[] = [
  {
    code: "VV02",
    bankName: "BANCO DO BRASIL",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  {
    code: "VV03",
    bankName: "BANCO DO BRASIL",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  {
    code: "VV04",
    bankName: "BANCO DO BRASIL",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  {
    code: "VV07",
    bankName: "CAIXA ECONÔMICA FEDERAL",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  {
    code: "VV09",
    bankName: "BANCO ITAÚ",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  {
    code: "VV10",
    bankName: "BANCO ITAÚ",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  {
    code: "VV14",
    bankName: "BANCO SAFRA",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },
  {
    code: "VV15",
    bankName: "BANCO SANTANDER",
    companyName: "Vale do Verdão S/A Açúcar e Álcool",
  },

  {
    code: "PNR1",
    bankName: "BANCO DO BRASIL",
    companyName: "Usina Panorama S/A",
  },
  {
    code: "PNR2",
    bankName: "BANCO DO BRASIL",
    companyName: "Usina Panorama S/A",
  },
  { code: "PNR4", bankName: "BANCO ITAÚ", companyName: "Usina Panorama S/A" },
  { code: "PNR5", bankName: "BANCO SAFRA", companyName: "Usina Panorama S/A" },
  {
    code: "PNR6",
    bankName: "BANCO SANTANDER",
    companyName: "Usina Panorama S/A",
  },
  {
    code: "PNR8",
    bankName: "BANCO DO BRASIL",
    companyName: "Usina Panorama S/A",
  },

  {
    code: "FSA1",
    bankName: "BANCO DO BRASIL",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  {
    code: "FSA2",
    bankName: "BANCO DO BRASIL",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  {
    code: "FSA3",
    bankName: "BANCO ITAÚ",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  {
    code: "FSA4",
    bankName: "BANCO BRADESCO",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  {
    code: "FSA5",
    bankName: "BANCO SAFRA",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  {
    code: "FSA6",
    bankName: "BANCO SANTANDER",
    companyName: "Floresta S/A Açúcar e Álcool",
  },
  {
    code: "FSA7",
    bankName: "BANCO ITAÚ",
    companyName: "Floresta S/A Açúcar e Álcool",
  },

  {
    code: "CAM1",
    bankName: "BANCO DO BRASIL",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },
  {
    code: "CAM2",
    bankName: "BANCO ITAÚ",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },
  {
    code: "CAM3",
    bankName: "BANCO DO BRASIL",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },
  {
    code: "CAM5",
    bankName: "BANCO SAFRA",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },
  {
    code: "CAM7",
    bankName: "BANCO SANTANDER",
    companyName: "Cambuí Açúcar e Álcool LTDA",
  },

  {
    code: "PRI1",
    bankName: "BANCO DO BRASIL",
    companyName: "Agropecuária Primavera",
  },
  {
    code: "PRI2",
    bankName: "BANCO ITAÚ",
    companyName: "Agropecuária Primavera",
  },
  {
    code: "PRI3",
    bankName: "BANCO DO BRASIL",
    companyName: "Agropecuária Primavera",
  },

  {
    code: "FLA1",
    bankName: "BANCO DO BRASIL",
    companyName: "Floresta Agrícola LTDA",
  },
  {
    code: "FLA2",
    bankName: "BANCO ITAÚ",
    companyName: "Floresta Agrícola LTDA",
  },

  {
    code: "EE01",
    bankName: "BANCO DO BRASIL",
    companyName: "Energética Entre Rios",
  },
  {
    code: "EE02",
    bankName: "BANCO ITAÚ",
    companyName: "Energética Entre Rios",
  },
  {
    code: "EE03",
    bankName: "BANCO BRADESCO",
    companyName: "Energética Entre Rios",
  },

  {
    code: "EC01",
    bankName: "BANCO DO BRASIL",
    companyName: "Energética Cambuí",
  },
  { code: "EC02", bankName: "BANCO ITAÚ", companyName: "Energética Cambuí" },
  {
    code: "EC03",
    bankName: "BANCO BRADESCO",
    companyName: "Energética Cambuí",
  },
];

async function main() {
  const uniqueCompanyNames = [
    ...new Set(accounts.map((account) => account.companyName)),
  ];

  for (const companyName of uniqueCompanyNames) {
    await prisma.company.upsert({
      where: { name: companyName },
      update: {},
      create: { name: companyName },
    });
  }

  for (const account of accounts) {
    const company = await prisma.company.findUnique({
      where: { name: account.companyName },
    });

    if (!company) {
      throw new Error(`Empresa não encontrada no seed: ${account.companyName}`);
    }

    await prisma.account.upsert({
      where: { code: account.code },
      update: {
        bankName: account.bankName,
        companyId: company.id,
      },
      create: {
        code: account.code,
        bankName: account.bankName,
        companyId: company.id,
      },
    });
  }

  console.log("Seed executado com sucesso.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
