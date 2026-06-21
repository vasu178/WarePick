# WarePick Deployment Guide

## Local Development

### Prerequisites
- Docker Desktop (with Docker Compose)
- Node.js 20+ and npm
- Supabase CLI (`npm install -g supabase`)

### 1. Start Supabase Locally

```bash
cd WarePick
supabase init       # Only first time
supabase start      # Starts Postgres, Realtime, Auth, Studio
```

After `supabase start`, note the output:
```
API URL:            http://127.0.0.1:54321
Anon key:           eyJhbG...
Service role key:   eyJhbG...
Studio URL:         http://127.0.0.1:54323
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in the Supabase keys from step 1:
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from above>
SUPABASE_SERVICE_ROLE_KEY=<service role key from above>
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from above>
```

### 3. Apply Database Migrations

```bash
supabase db reset   # Applies all migrations + seed.sql
```

This creates all tables, RLS policies, functions, and seeds 6 SKUs + 5 bots.

### 4. Start Backend Services

```bash
docker compose up --build
```

This starts:
- RabbitMQ (ports 5672, 15672 for management UI)
- 7 microservices (ports 3001-3007)

Monitor logs:
```bash
docker compose logs -f order-intake
docker compose logs -f bot-simulator
```

### 5. Start Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`

### 6. Test the Flow

1. Open the dashboard at `http://localhost:5173`
2. Click **"Enter Demo Mode"** (or sign up via Supabase Auth)
3. Click **"Create Demo Order"** to trigger the full pipeline
4. Watch the bot animate across the warehouse floor
5. Click **"Batch 10 Orders"** to stress-test

### Useful URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Supabase Studio | http://127.0.0.1:54323 |
| RabbitMQ Management | http://localhost:15672 (guest/guest) |
| Order Intake API | http://localhost:3001 |
| Analytics API | http://localhost:3007/analytics/summary |

---

## Production Deployment

### Frontend → Vercel

1. Push repo to GitHub
2. Import project in Vercel, set root directory to `frontend/`
3. Set environment variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-api-domain.com
   ```
4. Deploy

### Database → Supabase Cloud

1. Create project at https://supabase.com
2. Link local project:
   ```bash
   supabase link --project-ref your-project-id
   ```
3. Push migrations:
   ```bash
   supabase db push
   ```
4. Seed data via Supabase Studio SQL editor or:
   ```bash
   psql $DATABASE_URL < supabase/seed.sql
   ```

### Backend Services → AWS ECS / Fargate

Each service has its own Dockerfile. Deploy via:

1. **Build images**: `docker build -t warepick-order-intake -f services/order-intake/Dockerfile .`
2. **Push to ECR**: Tag and push to AWS ECR
3. **Create ECS task definitions**: One per service
4. **Create ECS services**: With Fargate launch type
5. **Set env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RABBITMQ_URL`
6. **RabbitMQ**: Use Amazon MQ (RabbitMQ) or self-hosted on EC2

### Environment Variables (Production)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RABBITMQ_URL=amqp://user:pass@your-rabbitmq-host:5672
```

---

## Troubleshooting

### Services can't connect to RabbitMQ
- RabbitMQ takes 15-30s to start. Services retry with exponential backoff.
- Check: `docker compose logs rabbitmq`

### Real-time updates not showing in frontend
- Ensure `supabase start` is running
- Check that migrations ran (especially `enable_realtime.sql`)
- Verify env vars in `.env` match `supabase status` output

### Bot positions not animating
- Bot positions use Supabase Broadcast — ensure frontend connects to correct Supabase URL
- Check bot-simulator logs: `docker compose logs bot-simulator`

### Database reset
```bash
supabase db reset       # Resets local DB + re-seeds
# or via API:
curl -X POST http://localhost:3001/orders/reset
```
