# HealthHub

App iOS pessoal (React Native + Expo) para rastrear hidratação, refeições e treinos.

## Stack

- **Mobile**: React Native + Expo + TypeScript + pnpm
- **Backend**: Node.js + Express + TypeScript + PostgreSQL + pnpm
- **Deploy**: EAS Build → TestFlight/AltStore | Render.com
- **CI**: GitHub Actions (typecheck, testes, build iOS, deploy backend)

## Setup rápido

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL (local ou Docker)

### Backend

```bash
cd backend
pnpm install
cp .env.example .env   # configure DATABASE_URL
pnpm run db:migrate
pnpm dev               # http://localhost:3000
```

### Mobile

```bash
cd mobile
pnpm install
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://<seu-ip>:3000
pnpm start
```

### Docker (opcional)

Na raiz do projeto:

```bash
docker compose up --build
```

API em `http://localhost:3000`, Postgres em `localhost:5432`.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/water?date=YYYY-MM-DD` | Água do dia |
| POST | `/water` | Adicionar água |
| DELETE | `/water/:id` | Remover entrada |
| GET | `/water/stats/week` | Stats 7 dias |
| GET | `/meals?date=YYYY-MM-DD` | Refeições do dia |
| GET | `/meals/week?start=YYYY-MM-DD` | Refeições da semana (7 dias) |
| POST | `/meals` | Adicionar refeição |
| PUT | `/meals/:id` | Atualizar refeição |
| DELETE | `/meals/:id` | Remover refeição |
| GET | `/workouts?date=YYYY-MM-DD` | Treinos do dia |
| GET | `/workouts/month?year=&month=` | Stats do mês |
| POST | `/workouts` | Adicionar treino |
| PUT | `/workouts/:id` | Atualizar treino |
| DELETE | `/workouts/:id` | Remover treino |

## Scripts

### Backend

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | API em modo desenvolvimento |
| `pnpm build` | Compila TypeScript + copia schema SQL |
| `pnpm start` | Produção (`dist/`) |
| `pnpm db:migrate` | Aplica schema no Postgres |
| `pnpm test` | Testes (Vitest + Supertest) |

### Mobile

| Comando | Descrição |
|---------|-----------|
| `pnpm start` | Expo dev server |
| `pnpm typecheck` | Verificação TypeScript |
| `pnpm build:ios` | EAS build iOS |

## EAS / TestFlight (manual)

1. `cd mobile && pnpm dlx eas-cli login`
2. `pnpm dlx eas-cli init` — vincula o projeto e gera `projectId`
3. Atualize `extra.eas.projectId` em [mobile/app.json](mobile/app.json)
4. Configure secrets no GitHub (veja abaixo)

## CI/CD

- **ci.yml** — backend build + testes; mobile typecheck
- **build-ios.yml** — EAS build ao push em `main` (`mobile/**`)
- **deploy-backend.yml** — webhook Render ao push em `main` (`backend/**`)

### GitHub Secrets

| Secret | Uso |
|--------|-----|
| `EXPO_TOKEN` | expo.dev → Access Tokens |
| `API_URL` | URL pública do backend (build mobile) |
| `RENDER_DEPLOY_HOOK_URL` | Deploy hook do serviço Render |

### Render

- **Build command**: `pnpm install && pnpm run build`
- **Start command**: `pnpm start`
- **Release command** (recomendado): `pnpm run db:migrate`

## Test plan

- [ ] `cd backend && pnpm install && pnpm run db:migrate && pnpm dev`
- [ ] `cd mobile && pnpm install && pnpm start` — Expo Go no iPhone
- [ ] Dashboard: score, gráfico de linha 7 dias, pull-to-refresh
- [ ] Água: quick-add, custom, delete, notificação 50/75/100%
- [ ] Refeições: dia + semana, add/edit/delete, calorias
- [ ] Treinos: calendário, add, toggle completo, delete
- [ ] `pnpm test` no backend passa
- [ ] `pnpm typecheck` no mobile passa

## Estrutura

```
healthhub/
├── mobile/          # Expo app
├── backend/         # Express API
├── docker-compose.yml
└── .github/workflows/
```
