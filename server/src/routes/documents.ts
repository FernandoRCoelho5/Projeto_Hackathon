import { Router } from "express";
import { getMachineByName } from "../data/machines.js";
import { getProtocol } from "../data/protocols.js";
import { renderTextPdf } from "../pdf.js";
import type { Criticidade, Especialidade } from "../types.js";

export const documentsRouter = Router();

const CRITICIDADE_LABELS: Record<Criticidade, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

documentsRouter.get("/documents/manual/:maquina", async (req, res) => {
  const maquina = decodeURIComponent(req.params.maquina);
  const machine = getMachineByName(maquina);
  if (!machine) {
    res.status(404).json({ error: "Máquina não encontrada." });
    return;
  }

  const pdf = await renderTextPdf({
    titulo: `Manual da Máquina — ${machine.nome}`,
    subtitulo: `${machine.fabricante} · ${machine.modelo}`,
    secoes: [
      {
        heading: "Especificações",
        lines: [
          `Setor: ${machine.setor}`,
          `Modelo: ${machine.modelo}`,
          `Fabricante: ${machine.fabricante}`,
          `Instalada em: ${new Date(machine.instaladaEm).toLocaleDateString("pt-BR")}`,
          `Criticidade: ${CRITICIDADE_LABELS[machine.criticidade]}`,
        ],
      },
      {
        heading: "Segurança",
        lines: [
          "Sempre bloquear e sinalizar (LOTO) antes de qualquer intervenção.",
          "Utilizar os EPIs exigidos para o setor.",
          "Não operar a máquina com proteções ou carenagens removidas.",
        ],
      },
      {
        heading: "Manutenção preventiva recomendada",
        lines: [
          "Inspeção visual e de ruído a cada turno.",
          "Verificação de lubrificação conforme plano do fabricante.",
          "Calibração de sensores a cada parada programada.",
        ],
      },
    ],
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="manual-${machine.id}.pdf"`);
  res.send(pdf);
});

documentsRouter.get("/documents/protocolo", async (req, res) => {
  const especialidade =
    typeof req.query.especialidade === "string"
      ? (req.query.especialidade as Especialidade)
      : undefined;
  const codigo = typeof req.query.codigo === "string" ? req.query.codigo : undefined;
  const protocolo = getProtocol(codigo, especialidade);

  const pdf = await renderTextPdf({
    titulo: "Protocolo de Correção",
    subtitulo: `${codigo ? `${codigo} · ` : ""}${protocolo.titulo}`,
    secoes: [{ heading: "Passo a passo", lines: protocolo.passos }],
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="protocolo-${codigo ?? especialidade ?? "geral"}.pdf"`,
  );
  res.send(pdf);
});
