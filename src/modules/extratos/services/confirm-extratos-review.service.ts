import {
  saveExtratos,
  type SaveExtratosInput,
} from "./save-extratos.service";

export async function confirmExtratosReview(input: SaveExtratosInput) {
  return saveExtratos(input);
}
