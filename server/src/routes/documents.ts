import { Router } from "express";
import { getMachineByName } from "../data/machines.js";
import { getProtocol } from "../data/protocols.js";
import { renderTextPdf, type PdfSection } from "../pdf.js";
import { getMaintenanceEventById, getTicketById } from "../store.js";
import type { Criticidade, Especialidade, TipoEventoManutencao } from "../types.js";

export const documentsRouter = Router();

const CRITICIDADE_LABELS: Record<Criticidade, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const TIPO_EVENTO_LABELS: Record<TipoEventoManutencao, string> = {
  reparo: "Reparo",
  troca_peca: "Troca de peça",
  preventiva: "Manutenção preventiva",
  outro: "Outro",
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

documentsRouter.get("/documents/relatorio-manutencao/:eventoId", async (req, res) => {
  const evento = getMaintenanceEventById(req.params.eventoId);
  if (!evento) {
    res.status(404).json({ error: "Evento de manutenção não encontrado." });
    return;
  }

  const machine = getMachineByName(evento.maquina);
  const ticket = evento.ticketId ? getTicketById(evento.ticketId) : undefined;

  const secoes: PdfSection[] = [
    {
      heading: "Máquina",
      lines: [
        `Nome: ${evento.maquina}`,
        ...(machine
          ? [
              `Setor: ${machine.setor}`,
              `Modelo: ${machine.modelo}`,
              `Fabricante: ${machine.fabricante}`,
              `Criticidade: ${CRITICIDADE_LABELS[machine.criticidade]}`,
            ]
          : []),
      ],
    },
    {
      heading: "Manutenção realizada",
      lines: [
        `Tipo: ${TIPO_EVENTO_LABELS[evento.tipo]}`,
        `Descrição: ${evento.descricao}`,
        ...(evento.pecasTrocadas && evento.pecasTrocadas.length > 0
          ? [`Peças trocadas: ${evento.pecasTrocadas.join(", ")}`]
          : []),
        `Registrado por: ${evento.registradoPor.nome}`,
        `Data: ${new Date(evento.criadoEm).toLocaleString("pt-BR")}`,
      ],
    },
  ];

  if (ticket) {
    secoes.push({
      heading: "Chamado relacionado",
      lines: [
        ...(ticket.codigoFalha ? [`Código de falha: ${ticket.codigoFalha}`] : []),
        `Descrição: ${ticket.descricao}`,
        `Aberto em: ${new Date(ticket.abertoEm).toLocaleString("pt-BR")}`,
        ...(ticket.fechadoEm ? [`Encerrado em: ${new Date(ticket.fechadoEm).toLocaleString("pt-BR")}`] : []),
        ...(ticket.mttrMs !== null ? [`MTTR: ${Math.round(ticket.mttrMs / 60000)} min`] : []),
      ],
    });
  }

  const pdf = await renderTextPdf({
    titulo: `Relatório de Manutenção — ${evento.maquina}`,
    subtitulo: `${TIPO_EVENTO_LABELS[evento.tipo]} · ${new Date(evento.criadoEm).toLocaleDateString("pt-BR")}`,
    secoes,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="relatorio-${evento.id}.pdf"`);
  res.send(pdf);
});
