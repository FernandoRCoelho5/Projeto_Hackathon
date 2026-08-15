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
| `server/` | Node + Express + TypeScript, contas de usuário no Postgres (Neon), tickets e eventos ainda em memória |

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
    Registro.tsx         /registro — setor → máquina, histórico (com link de relatório por chamado), problemas recorrentes
    Calculator.tsx       /calculadora — calculadora de impacto (MTTR/MTBF), só Administrador
    Usuarios.tsx          /usuarios — criação de conta (nome, usuário, senha, papel), só Administrador
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
  index.ts            entrypoint de dev/produção tradicional: carrega .env, importa app.ts e dá listen()
  db.ts                pool de conexão com o Neon (DATABASE_URL) + migrate() (cria tabela `users` se não existir)
  auth.ts             login contra o Postgres + sessão via JWT assinado (NEXTAUTH_SECRET) — stateless, sem Map
  store.ts            "banco de dados" em memória: tickets, eventos de manutenção (ainda não migrado pro Postgres)
  simulation.ts        gerador de chamado simulado + timer do "Modo automático"
  pdf.ts               gerador de PDF simples (título + seções) via pdfkit
  routes/             um router por recurso (auth, users, tickets, simulation, maintenanceEvents, meta, documents)
  data/
    users.ts             camada de acesso a usuários no Postgres (hash de senha, seed das contas demo, criação)
    machines.ts, technicians.ts, faultCodes.ts, protocols.ts, seed.ts   dados estáticos (máquinas, técnicos, códigos de falha, protocolos, seed de tickets)

server/api/index.ts  entrypoint serverless (Vercel) — importa o mesmo app.ts
```

## Telas por papel

O acesso é por login (usuário + senha), com uma hierarquia de permissões aplicada também no
servidor — não é só esconder botão na tela. Só existem duas contas: **Administrador** (visão
gerencial, dados apurados, cria contas novas) e **Técnico** (executa a manutenção). Não há
autocadastro — toda conta nova é criada pelo Administrador em `/usuarios`. Não há reporte manual
de problema no protótipo — o chamado é sempre acionado automaticamente (CLP simulado).

| Tela | Rota | Quem vê |
|---|---|---|
| Painel | `/painel` | todos |
| Em andamento | `/em-andamento` | todos |
| Registro | `/registro` | todos |
| Calculadora de impacto | `/calculadora` | Administrador |
| Usuários | `/usuarios` | Administrador |

Contas de teste (login e senha preenchem sozinhos na tela de Login — seedadas automaticamente no
Postgres na primeira query, se a tabela `users` estiver vazia):

| Usuário | Senha | Papel | Pode |
|---|---|---|---|
| `marina` | `1234` | Administrador | Painel (simular incidente / modo automático), Em andamento (forçar encerramento), Registro (registrar evento de manutenção), Calculadora de impacto, Usuários (criar contas) |
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

## Relatório de manutenção

Assim que um chamado é encerrado (`POST /api/tickets/:id/close`), a tela Em andamento mostra um
aviso "manutenção concluída" com o link **Gerar relatório**, que abre um PDF gerado na hora
(`GET /api/documents/relatorio-chamado/:ticketId`, `server/src/routes/documents.ts`) com máquina,
descrição do chamado, quem assumiu, tempos e MTTR — sem depender de alguém preencher o formulário
de "Registrar evento" em Registro. O mesmo link fica disponível depois na tabela de histórico de
cada máquina (Registro) e no card do chamado fechado (`TicketCard`), então o relatório não se
perde quando o aviso é dispensado.

## Usuários e contas

Criação de conta é exclusiva do Administrador, em `/usuarios` (`GET/POST /api/users`,
`server/src/routes/users.ts`). Contas ficam no Postgres (Neon) — tabela `users`, criada
automaticamente na primeira query (`server/src/db.ts`) — com senha hasheada (scrypt, nunca texto
puro). O login assina um token JWT (HMAC-SHA256 com `NEXTAUTH_SECRET`) que carrega
id/nome/username/papel/especialidade; a sessão é stateless, então sobrevive a cold start e a
múltiplas instâncias serverless (ao contrário do token opaco em `Map` de antes).

## Modo simulação

No Painel, "Simular incidente" (só Administrador) gera um chamado a partir de uma tabela fixa de
códigos de falha (`server/src/data/faultCodes.ts` — simula a leitura de um CLP). O toggle "Modo
automático" (`server/src/simulation.ts`) liga um gerador em background no servidor (a cada
12-18s), visível para todo mundo que estiver olhando o painel.

## Variáveis de ambiente

Cada pasta tem seu `.env.example`. Copie pra `.env` (já ignorado pelo git) e preencha:

- **`server/.env.example`**
  - `PORT` — porta do backend em dev (padrão 3001).
  - `DATABASE_URL` — **obrigatória**. Connection string do Neon (Dashboard >
    Connect). Usada por `server/src/db.ts` pra conectar e criar a tabela
    `users` automaticamente (`migrate()`). Sem ela o server não sobe.
  - `NEXTAUTH_SECRET` — **obrigatória**. Assina o token de sessão
    (HMAC-SHA256, `server/src/auth.ts`). Gere com: `openssl rand -base64 32`.
    Sem ela o server não sobe.
  - Tickets e eventos de manutenção ainda vivem em memória (`store.ts`) — só
    contas de usuário foram migradas pro Postgres. Ver limitação abaixo.
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

**Limitação conhecida:** contas de usuário já estão no Postgres e a sessão já
é um JWT stateless (sobrevive a múltiplas instâncias e cold starts) — mas
tickets, eventos de manutenção e o timer do "Modo automático" ainda vivem em
memória (`store.ts`, `simulation.ts`), o que não sobrevive a múltiplas
instâncias serverless nem a cold starts. Pra rodar de verdade na Vercel, essa
parte também precisa migrar pro Postgres; o "Modo automático" (setTimeout
recursivo) precisa virar algo compatível com serverless — ex.: Vercel Cron
Job chamando um endpoint que sorteia o próximo ticket, em vez de um timer
vivendo no processo. Isso ainda não foi feito.

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
