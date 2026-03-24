export const SUCATA_ACCOUNT_CODES = ["VV02", "PNR2", "FSA2"];

export function isSucataAccount(accountCode: string) {
  return SUCATA_ACCOUNT_CODES.includes(accountCode.toUpperCase());
}
