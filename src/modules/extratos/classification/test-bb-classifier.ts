import { classifyBbTransaction } from "./classify-bb-transaction";

const examples = [
  {
    description: "Transferência recebida",
    signal: "C",
  },
  {
    description: "Transferência enviada",
    signal: "D",
  },
  {
    description: "Tar Extrato Meio Magnét",
    signal: "D",
  },
  {
    description: "TED-Crédito em Conta",
    signal: "C",
  },
  {
    description: "Saldo Anterior",
    signal: "C",
  },
  {
    description: "Pix recebido",
    signal: "C",
  },
  {
    description: "Pix enviado",
    signal: "D",
  },
  {
    description: "Rsg Automático",
    signal: "C",
  },
  {
    description: "Aplicação automática",
    signal: "D",
  },
  {
    description: "",
    signal: "C",
  },
  {
    description: "Coisa que não conheço",
    signal: "D",
  },
];

for (const example of examples) {
  const result = classifyBbTransaction({
    description: example.description,
    signal: example.signal,
  });

  console.log({
    description: example.description,
    signal: example.signal,
    assignment: result,
  });
}
