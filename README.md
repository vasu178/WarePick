# 📦 WarePick — Smart Warehouse Fulfillment Simulator

> Event-driven microservices architecture that simulates a real-world warehouse fulfillment pipeline with animated bots, real-time tracking, and operational analytics.

## 🎯 What is WarePick?

WarePick simulates a warehouse fulfillment pipeline where:
1. **Orders** enter the system and are validated
2. **Inventory** is checked and reserved atomically
3. **Tasks** are assigned to available warehouse bots
4. **Bots** navigate the warehouse floor (animated in real-time)
5. **Packages** are created with mock shipping labels
6. **Shipments** are dispatched with tracking IDs
7. **Analytics** track KPIs across the entire pipeline

All services communicate asynchronously via RabbitMQ, with Supabase providing the database, authentication, and real-time updates to the React dashboard.

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↕ Supabase Realtime (CDC + Broadcast)
Supabase (Postgres + Auth + Realtime)
    ↕ service_role key
┌──────────────────────────────────────────────────────────┐
│                   RabbitMQ Topic Exchange                  │
├──────────┬──────────┬─────────┬─────────┬────────┬───────┤
│ Order    │ Inven-   │ Task    │ Bot     │ Pack   │ Ship  │
│ Intake   │ tory     │ Assign  │ Simul.  │ Label  │ Notif │
│ :3001    │ :3002    │ :3003   │ :3004   │ :3005  │ :3006 │
└──────────┴──────────┴─────────┴─────────┴────────┴───────┘
                    + Analytics Service :3007 (wildcard consumer)
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Framer Motion, Lucide Icons |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT + RBAC) |
| Realtime | Supabase Realtime (CDC + Broadcast) |
| Messaging | RabbitMQ (Topic Exchange) |
| Backend | Node.js, Express (7 microservices) |
| Containers | Docker Compose |
| Deployment | Vercel (frontend) + AWS ECS/Fargate (backend) |

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm install -g supabase`

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/WarePick.git
cd WarePick
cp .env.example .env
```

### 2. Start Supabase

```bash
supabase start
# Copy the API URL, anon key, and service role key into .env
supabase db reset   # Apply migrations + seed data
```

### 3. Start Backend

```bash
docker compose up --build
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open Dashboard

Navigate to `http://localhost:5173` and click **"Enter Demo Mode"**.

Click **"Create Demo Order"** and watch the full fulfillment pipeline animate in real-time!

## 📁 Project Structure

```
WarePick/
├── docs/                          # Architecture & API documentation
│   ├── architecture.md
│   ├── api-contracts.md
│   └── deployment.md
├── frontend/                      # React + Vite dashboard
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── hooks/                 # Supabase + API hooks
│   │   ├── data/                  # Warehouse grid layout
│   │   └── lib/                   # Supabase client
│   └── index.html
├── services/                      # 7 Node.js microservices
│   ├── order-intake/              # Port 3001
│   ├── inventory-check/           # Port 3002
│   ├── task-assignment/           # Port 3003
│   ├── bot-simulator/             # Port 3004
│   ├── packing-label/             # Port 3005
│   ├── shipping-notification/     # Port 3006
│   └── analytics-dashboard/       # Port 3007
├── shared/                        # Shared utilities
│   ├── events.js                  # Event name constants
│   ├── statuses.js                # Order status constants
│   ├── supabaseClient.js          # Supabase client factory
│   └── rabbitmq.js                # RabbitMQ connection helper
├── supabase/                      # Database
│   ├── migrations/                # 9 versioned SQL migrations
│   └── seed.sql                   # Demo data (6 SKUs, 5 bots)
├── docker-compose.yml             # Service orchestration
├── .env.example                   # Environment template
└── WarePick_PRD.md                # Product requirements
```

## 📡 Real-time Strategy

| Data Type | Method | Latency | Persisted |
|-----------|--------|---------|-----------|
| Bot positions (500ms ticks) | Supabase Broadcast | ~6-50ms | No |
| Order status changes | Supabase CDC | ~50-200ms | Yes |
| Inventory updates | Supabase CDC | ~50-200ms | Yes |
| System events | Supabase Broadcast | ~6-50ms | Via event_log |

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| Dashboard | http://localhost:5173 |
| Supabase Studio | http://127.0.0.1:54323 |
| RabbitMQ Management | http://localhost:15672 |
| Order API | http://localhost:3001/orders |
| Analytics API | http://localhost:3007/analytics/summary |

## 📚 Documentation

- [Architecture](docs/architecture.md) — System design, event flow, tech stack
- [API Contracts](docs/api-contracts.md) — REST endpoints, RabbitMQ message schemas
- [Deployment Guide](docs/deployment.md) — Local setup, Vercel, AWS ECS

## 📄 License

MIT
