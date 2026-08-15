# Aciona

MVP de acionamento de manutenção para fábricas automotivas. Em vez do fluxo
sequencial (funcionário → team leader → manutenção), o Aciona notifica todo
mundo ao mesmo tempo via um painel compartilhado, classifica o problema com
IA e atribui o técnico certo automaticamente.

## Stack

| | |
|---|---|
| `client/` | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| `server/` | Node + Express + TypeScript, estado em memória (sem banco ainda) |

Duas pastas independentes, cada uma com seu próprio `package.json`. Não é um
monorepo com workspace — instale e rode cada uma separadamente.

## Rodando localmente

Requer Node 18+. Abra dois terminais:

```bash
# terminal 1 — backend (porta 3001)
cd server
npm install
npm run dev

# terminal 2 — frontend (porta 5173, com proxy /api -> :3001)
cd client
npm install
npm run dev
```

Acesse http://localhost:5173. Em dev o Vite já faz proxy de `/api/*` pro
backend (`client/vite.config.ts`), então não precisa configurar nada além
disso pra rodar local.

## Estrutura do projeto

```
client/src/
  App.tsx            rotas (react-router) + regras de "quem vê o quê"
  pages/              uma tela por arquivo, mapeadas em App.tsx
    Login.tsx           tela pública, sem auth
    Panel.tsx           /painel — fila de chamados, assumir, simular
    Report.tsx          /reportar — abrir chamado manualmente (chama IA)
    EmAndamento.tsx      /em-andamento — chamados assumidos, encerrar
    Registro.tsx         /registro — histórico + eventos de manutenção por máquina
    Calculator.tsx       /calculadora — calculadora de impacto (MTTR/MTBF)
  components/         peças reutilizáveis entre telas (cards, badges, timer, navbar)
  components/ui/      componentes de UI "soltos" (estilo shadcn), ex.: hero-section-dark.tsx
  lib/
    api.ts              client HTTP (fetch) + hooks de polling (useTickets, useMachines...)
    auth.ts             hook useAuth + labels de papel
    session.ts          token no localStorage
    types.ts            tipos espelhando server/src/types.ts
    utils.ts            helper cn() (clsx + tailwind-merge)

server/src/
  app.ts              cria e configura o Express app (rotas, middlewares) — sem listen()
  index.ts            entrypoint de dev/produção tradicional: importa app.ts e dá listen()
  auth.ts             sessões (token opaco em Map) + middlewares requireAuth/requireRole
  store.ts            "banco de dados" em memória: tickets, eventos de manutenção
  simulation.ts        gerador de chamado simulado + timer do "Modo automático"
  ai.ts               chamada à API da Anthropic pra classificar chamado (com fallback heurístico)
  routes/             um router por recurso (auth, tickets, simulation, maintenanceEvents, meta)
  data/                dados estáticos: usuários demo, máquinas, técnicos, códigos de falha, seed

server/api/index.ts  entrypoint serverless (Vercel) — importa o mesmo app.ts
```

## Telas por papel

O acesso é por login (usuário + senha), com uma hierarquia de permissões aplicada também no
servidor — não é só esconder botão na tela.

| Tela | Rota | Quem vê |
|---|---|---|
| Painel | `/painel` | todos |
| Reportar | `/reportar` | Funcionário, Team Leader |
| Em andamento | `/em-andamento` | Manutenção, Team Leader |
| Registro | `/registro` | todos |
| Calculadora de impacto | `/calculadora` | Team Leader |

Contas de teste, uma por persona (login e senha preenchem sozinhos na tela de Login):

| Usuário | Senha | Papel | Pode |
|---|---|---|---|
| `joao` | `1234` | Funcionário | Ver o Painel, reportar problema, ver o Registro |
| `marina` | `1234` | Team Leader | Tudo do funcionário + Em andamento, forçar encerramento de chamado, registrar evento de manutenção, simular incidente / modo automático, Calculadora de impacto |
| `carlos` | `1234` | Manutenção (Elétrica) | Ver o Painel, assumir chamado, encerrar o que assumiu, ver Em andamento e o Registro |
| `ana` | `1234` | Manutenção (Mecânica) | Igual ao Carlos |
| `rafael` | `1234` | Manutenção (Hidráulica) | Igual ao Carlos |

Só quem assumiu um chamado ("Assumir chamado" no Painel) pode encerrá-lo — outro manutentor vê
"Em atendimento por fulano" na tela Em andamento, sem poder mexer. Team Leader pode forçar o
encerramento de qualquer chamado.

## Classificação por IA

O reporte manual de problema (`server/src/ai.ts`) chama a API da Anthropic
(`claude-opus-5`) para classificar prioridade, especialidade e checklist. Sem
uma chave configurada, o sistema usa automaticamente um classificador
heurístico local (por palavras-chave em português) — o app funciona igual, só
que sem IA de verdade. Ver [Variáveis de ambiente](#variáveis-de-ambiente).

## Modo simulação

No Painel, "Simular incidente" gera um chamado a partir de uma tabela fixa de
códigos de falha (`server/src/data/faultCodes.ts`, sem IA — simula a leitura
de um CLP). O toggle "Modo automático" (`server/src/simulation.ts`) liga um
gerador em background no servidor (a cada 12-18s), visível para todo mundo
que estiver olhando o painel.

## Variáveis de ambiente

Cada pasta tem seu `.env.example`. Copie pra `.env` (já ignorado pelo git) e preencha:

- **`server/.env.example`**
  - `ANTHROPIC_API_KEY` — opcional, liga a classificação por IA real.
  - `PORT` — porta do backend em dev (padrão 3001).
  - `DATABASE_URL` / `NEXTAUTH_SECRET` — placeholders pra próxima etapa (Neon
    Postgres + sessão assinada). **Ainda não usados no código**: hoje tickets,
    eventos e sessões vivem em memória (`store.ts`, `auth.ts`). Ver limitação
    abaixo.
- **`client/.env.example`**
  - `VITE_API_URL` — opcional, só precisa em produção se client e server
    forem hospedados em domínios separados (ver Hospedagem).

## Hospedagem (Vercel)

`client/` e `server/` têm cada um seu `vercel.json` e são pensados como **dois
projetos Vercel separados** (aponte o "Root Directory" de cada projeto pra
pasta correspondente):

- **`client/`**: build estático do Vite, com rewrite de SPA pra rotas do React Router.
- **`server/`**: o Express app (`server/src/app.ts`) roda como função
  serverless via `server/api/index.ts`. `server/src/index.ts` continua sendo
  o entrypoint de dev local / hosting tradicional (`npm run dev` / `npm
  start`), que faz `app.listen(...)` normalmente.

Se os dois projetos ficarem em domínios diferentes, defina `VITE_API_URL` no
projeto do client apontando pra URL pública do server (CORS já está liberado
no Express).

**Limitação conhecida:** o server hoje guarda tudo em memória (tickets,
sessões de login, o timer do "Modo automático") — isso não sobrevive a
múltiplas instâncias serverless nem a cold starts. Pra rodar de verdade na
Vercel, sessão e estado precisam migrar pra um backend externo (Neon Postgres
via `DATABASE_URL`, sessão assinada via `NEXTAUTH_SECRET` em vez do token
opaco em `Map`); o "Modo automático" (setTimeout recursivo) também precisa
virar algo compatível com serverless — ex.: Vercel Cron Job chamando um
endpoint que sorteia o próximo ticket, em vez de um timer vivendo no
processo. Isso ainda não foi feito.

## Scripts úteis

```bash
# client/
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build
npm run lint       # oxlint
npm run preview    # serve o build de produção localmente

# server/
npm run dev       # tsx watch (hot reload)
npm run build     # tsc -p tsconfig.json
npm start          # node dist/index.js (após build)
```
