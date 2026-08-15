# OpSync

MVP de acionamento de manutenção para fábricas automotivas. O chamado é
aberto automaticamente a partir da leitura de um CLP (simulada), sem
depender de alguém reportar o problema manualmente: todo mundo com acesso ao
painel vê o chamado ao mesmo tempo, o técnico responsável é notificado com
um alerta cronometrado, e cada máquina carrega seu próprio histórico e
documentação técnica.

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
    Panel.tsx           /painel — fila de chamados, alerta cronometrado do técnico, simular
    EmAndamento.tsx      /em-andamento — chamados assumidos, encerrar
    Registro.tsx         /registro — setor → máquina, histórico, problemas recorrentes
    Calculator.tsx       /calculadora — calculadora de impacto (MTTR/MTBF)
  components/         peças reutilizáveis entre telas (cards, badges, timer, countdown, navbar, logo)
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
  pdf.ts               gerador de PDF simples (título + seções) via pdfkit
  routes/             um router por recurso (auth, tickets, simulation, maintenanceEvents, meta, documents)
  data/                dados estáticos: usuários demo, máquinas, técnicos, códigos de falha, protocolos, seed

server/api/index.ts  entrypoint serverless (Vercel) — importa o mesmo app.ts
```

## Telas por papel

O acesso é por login (usuário + senha), com uma hierarquia de permissões aplicada também no
servidor — não é só esconder botão na tela. Só existem duas contas: **Administrador** (visão
gerencial, dados apurados) e **Técnico** (executa a manutenção). Não há reporte manual de
problema no protótipo — o chamado é sempre acionado automaticamente (CLP simulado).

| Tela | Rota | Quem vê |
|---|---|---|
| Painel | `/painel` | todos |
| Em andamento | `/em-andamento` | todos |
| Registro | `/registro` | todos |
| Calculadora de impacto | `/calculadora` | Administrador |

Contas de teste (login e senha preenchem sozinhos na tela de Login):

| Usuário | Senha | Papel | Pode |
|---|---|---|---|
| `marina` | `1234` | Administrador | Painel (simular incidente / modo automático), Em andamento (forçar encerramento), Registro (registrar evento de manutenção), Calculadora de impacto |
| `carlos` | `1234` | Técnico (Elétrica) | Receber alerta de chamado, aceitar/recusar, assumir chamado, encerrar o que assumiu, ver Em andamento e o Registro |
| `ana` | `1234` | Técnico (Mecânica) | Igual ao Carlos |
| `rafael` | `1234` | Técnico (Hidráulica) | Igual ao Carlos |

Quando um chamado é aberto pro técnico responsável pela especialidade, ele aparece destacado no
Painel com um contador regressivo (90s) pra aceitar — se o tempo expira ou o técnico recusa, o
chamado cai na fila geral (visível e assumível por qualquer técnico). Só quem assumiu um chamado
pode encerrá-lo — outro técnico vê "Em atendimento por fulano" na tela Em andamento, sem poder
mexer. Administrador pode forçar o encerramento de qualquer chamado.

## Manual da máquina e protocolo de correção

Cada chamado, no Painel e em Em andamento, tem links pra dois PDFs gerados pelo servidor
(`server/src/pdf.ts`): o manual da máquina (`GET /api/documents/manual/:maquina`, dados de
`server/src/data/machines.ts`) e o protocolo de correção daquele problema específico
(`GET /api/documents/protocolo?especialidade=&codigo=`, `server/src/data/protocols.ts` — um
protocolo por código de falha, com fallback genérico por especialidade). São rotas públicas
(sem auth) por serem material de referência, o que permite abrir direto num `<a href>` em nova
aba.

## Modo simulação

No Painel, "Simular incidente" (só Administrador) gera um chamado a partir de uma tabela fixa de
códigos de falha (`server/src/data/faultCodes.ts` — simula a leitura de um CLP). O toggle "Modo
automático" (`server/src/simulation.ts`) liga um gerador em background no servidor (a cada
12-18s), visível para todo mundo que estiver olhando o painel.

## Variáveis de ambiente

Cada pasta tem seu `.env.example`. Copie pra `.env` (já ignorado pelo git) e preencha:

- **`server/.env.example`**
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
