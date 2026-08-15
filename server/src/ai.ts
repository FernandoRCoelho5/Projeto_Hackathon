import Anthropic from "@anthropic-ai/sdk";
import type { Especialidade, Prioridade } from "./types.js";

export interface Classification {
  prioridade: Prioridade;
  especialidade: Especialidade;
  checklist: string[];
}

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

if (!client) {
  console.warn(
    "[ai] ANTHROPIC_API_KEY não configurada — usando classificação heurística local (fallback). " +
      "Defina a variável de ambiente para usar a IA real (claude-opus-5).",
  );
}

const CLASSIFICATION_SCHEMA = {
  type: "object",
  properties: {
    prioridade: { type: "string", enum: ["Vermelho", "Amarelo", "Verde"] },
    especialidade: { type: "string", enum: ["Elétrica", "Mecânica", "Hidráulica"] },
    checklist: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 3,
    },
  },
  required: ["prioridade", "especialidade", "checklist"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Você simula a leitura automática de um código de falha de um CLP industrial \
numa fábrica automotiva, a partir da descrição em texto livre de um funcionário. \
Classifique o problema em prioridade (Vermelho = parada crítica / risco / produção parada; \
Amarelo = atenção, degradação, precisa de manutenção em breve; Verde = preventivo, sem urgência), \
especialidade responsável (Elétrica, Mecânica ou Hidráulica) e um checklist curto (2-3 itens) \
de verificação inicial que o técnico deve fazer ao chegar. Seja direto e técnico, em português do Brasil.`;

async function classifyWithClaude(descricao: string): Promise<Classification> {
  // `output_config` (structured outputs) is a newer API field not yet in this
  // SDK version's TypeScript types — the SDK still forwards unknown keys as-is,
  // so we build the request as a plain object and bypass the typed overload.
  const params = {
    model: "claude-opus-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: CLASSIFICATION_SCHEMA,
      },
    },
    messages: [
      {
        role: "user",
        content: `Descrição do problema reportado: "${descricao}"`,
      },
    ],
  };

  const response = (await client!.messages.create(
    params as unknown as Anthropic.MessageCreateParamsNonStreaming,
  )) as Anthropic.Message;

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta da IA sem bloco de texto");
  }
  const parsed = JSON.parse(textBlock.text) as Classification;
  return parsed;
}

const KEYWORDS: { pattern: RegExp; especialidade: Especialidade }[] = [
  { pattern: /(óleo|oleo|vazamento|hidráulic|hidraulic|pressão|pressao|mangueira|cilindro)/i, especialidade: "Hidráulica" },
  { pattern: /(elétric|eletric|energia|curto|faísca|faisca|painel|disjuntor|não liga|nao liga|sensor)/i, especialidade: "Elétrica" },
];

const RED_FLAGS = /(parou|parada total|não liga|nao liga|quebrou|quebrado|fumaça|fumaca|faísca|faisca|travou|trava total)/i;
const YELLOW_FLAGS = /(barulho|ruído|ruido|lento|instável|instavel|vibra|esquenta|superaquec|intermitente)/i;

const CHECKLISTS: Record<Especialidade, string[]> = {
  Elétrica: [
    "Verificar disjuntores e fusíveis do painel",
    "Medir tensão de alimentação do motor/comando",
    "Inspecionar cabos e conexões visíveis por sinais de sobreaquecimento",
  ],
  Mecânica: [
    "Verificar alinhamento e fixação dos componentes móveis",
    "Checar nível de lubrificação e desgaste de rolamentos",
    "Inspecionar ruídos e vibração com a máquina em vazio",
  ],
  Hidráulica: [
    "Checar nível e vazamentos no reservatório de óleo",
    "Verificar pressão do sistema no manômetro",
    "Inspecionar mangueiras e conexões por desgaste",
  ],
};

function classifyHeuristic(descricao: string): Classification {
  const especialidade =
    KEYWORDS.find((k) => k.pattern.test(descricao))?.especialidade ?? "Mecânica";

  let prioridade: Prioridade = "Verde";
  if (RED_FLAGS.test(descricao)) prioridade = "Vermelho";
  else if (YELLOW_FLAGS.test(descricao)) prioridade = "Amarelo";

  return {
    prioridade,
    especialidade,
    checklist: CHECKLISTS[especialidade],
  };
}

export async function classifyWithAI(descricao: string): Promise<Classification> {
  if (!client) return classifyHeuristic(descricao);
  try {
    return await classifyWithClaude(descricao);
  } catch (err) {
    console.error("[ai] Falha ao chamar a API da Anthropic, usando fallback heurístico:", err);
    return classifyHeuristic(descricao);
  }
}
