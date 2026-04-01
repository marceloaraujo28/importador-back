import { prisma } from "../src/lib/prisma";

type SeedCompany = {
  name: string;
  groupName: string;
};

type SeedAccount = {
  code: string;
  bankName: string;
  companyName: string;
};

const companies: SeedCompany[] = [
  {
    name: "Vale do Verdão S/A Açúcar e Álcool",
    groupName: "Grupo Vale do Verdão",
  },
  { name: "Usina Panorama S/A", groupName: "Grupo Vale do Verdão" },
  { name: "Floresta S/A Açúcar e Álcool", groupName: "Grupo Vale do Verdão" },
  { name: "Agropecuária Primavera LTDA", groupName: "Grupo Vale do Verdão" },
  { name: "Floresta Agrícola LTDA", groupName: "Grupo Vale do Verdão" },
  { name: "Energética Entre Rios", groupName: "Grupo Vale do Verdão" },

  { name: "Cambuí Açúcar e Álcool LTDA", groupName: "Grupo Cambuí" },
  { name: "Energética Cambuí LTDA", groupName: "Grupo Cambuí" },
];

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
    companyName: "Agropecuária Primavera LTDA",
  },
  {
    code: "PRI2",
    bankName: "BANCO ITAÚ",
    companyName: "Agropecuária Primavera LTDA",
  },
  {
    code: "PRI3",
    bankName: "BANCO DO BRASIL",
    companyName: "Agropecuária Primavera LTDA",
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
    companyName: "Energética Cambuí LTDA",
  },
  {
    code: "EC02",
    bankName: "BANCO ITAÚ",
    companyName: "Energética Cambuí LTDA",
  },
  {
    code: "EC03",
    bankName: "BANCO BRADESCO",
    companyName: "Energética Cambuí LTDA",
  },
];

async function main() {
  const uniqueGroupNames = [
    ...new Set(companies.map((company) => company.groupName)),
  ];

  for (const groupName of uniqueGroupNames) {
    await prisma.companyGroup.upsert({
      where: { name: groupName },
      update: {},
      create: { name: groupName },
    });
  }

  for (const company of companies) {
    const group = await prisma.companyGroup.findUnique({
      where: { name: company.groupName },
    });

    if (!group) {
      throw new Error(`Grupo não encontrado no seed: ${company.groupName}`);
    }

    await prisma.company.upsert({
      where: { name: company.name },
      update: {
        groupId: group.id,
      },
      create: {
        name: company.name,
        groupId: group.id,
      },
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

  const allAccounts = await prisma.account.findMany();

  for (const account of allAccounts) {
    await prisma.accountOpeningBalance.upsert({
      where: { accountId: account.id },
      update: {},
      create: {
        accountId: account.id,
        referenceDate: null,
        initialAvailable: 0,
        initialApplication: 0,
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
