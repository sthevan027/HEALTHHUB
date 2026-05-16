# HealthHub

iOS app pessoal para rastrear hidratação, refeições e treinos.

## Stack

- **Mobile**: React Native + Expo + TypeScript
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Deploy**: EAS Build → TestFlight | Render.com

## Setup rápido

### Backend

```bash
cd backend
npm install
cp .env.example .env   # configure DATABASE_URL
npm run db:migrate     # cria as tabelas
npm run dev            # http://localhost:3000
```

### Mobile

```bash
cd mobile
npm install
cp .env.example .env   # configure EXPO_PUBLIC_API_URL
npx expo start
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/water?date=YYYY-MM-DD` | Água do dia |
| POST | `/water` | Adicionar água |
| DELETE | `/water/:id` | Remover entrada |
| GET | `/water/stats/week` | Stats 7 dias |
| GET | `/meals?date=YYYY-MM-DD` | Refeições do dia |
| POST | `/meals` | Adicionar refeição |
| PUT | `/meals/:id` | Atualizar refeição |
| DELETE | `/meals/:id` | Remover refeição |
| GET | `/workouts?date=YYYY-MM-DD` | Treinos do dia |
| GET | `/workouts/month?year=&month=` | Stats do mês |
| POST | `/workouts` | Adicionar treino |
| PUT | `/workouts/:id` | Atualizar treino |
| DELETE | `/workouts/:id` | Remover treino |

## CI/CD

- Push em `main` com mudanças em `mobile/` → build iOS automático via EAS
- Push em `main` com mudanças em `backend/` → deploy no Render

### GitHub Secrets necessários

- `EXPO_TOKEN` — gerado em expo.dev/accounts/[username]/settings/access-tokens
- `API_URL` — URL pública do backend
- `RENDER_DEPLOY_HOOK_URL` — webhook do serviço no Render
