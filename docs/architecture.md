# WarePick Architecture

## System Overview

WarePick is an event-driven microservices system that simulates a warehouse fulfillment pipeline. Orders flow through 7 independent services connected via RabbitMQ messaging, with Supabase providing the database, authentication, and real-time capabilities.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          React Dashboard (Vite)                             │
│  ┌───────────┐  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ OrderPanel│  │  WarehouseFloor   │  │ AnalyticsPanel   │                 │
│  │ (CRUD)    │  │  (Bot Animation) │  │ (KPIs, Events)   │                 │
│  └─────┬─────┘  └────────┬─────────┘  └────────┬─────────┘                 │
│        │   Supabase CDC   │ Supabase Broadcast   │ Supabase CDC             │
└────────┼──────────────────┼──────────────────────┼──────────────────────────┘
         │                  │                      │
┌────────▼──────────────────▼──────────────────────▼──────────────────────────┐
│                        Supabase (Postgres + Realtime + Auth)                │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │
    ┌─────────────────────────────────────┼──────────────────────────────────┐
    │                          RabbitMQ (Topic Exchange)                      │
    │                        Exchange: warepick.events                        │
    └───┬──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────────┘
        │      │      │      │      │      │      │
   ┌────▼──┐┌──▼───┐┌─▼──┐┌─▼──┐┌──▼──┐┌──▼──┐┌──▼──┐
   │Order  ││Inven ││Task││Bot ││Pack ││Ship ││Anal │
   │Intake ││Check ││Asgn││Sim ││Label││Notif││ytics│
   │:3001  ││:3002 ││:3003││:3004││:3005││:3006││:3007│
   └───────┘└──────┘└────┘└────┘└─────┘└─────┘└─────┘
```

## Event Flow (Order Lifecycle)

```
1. Frontend → POST /orders → Order Intake Service
2. Order Intake → publishes 'order.created' → RabbitMQ
3. Inventory Check ← consumes 'order.created'
   → checks stock → reserves via RPC → publishes 'inventory.reserved' OR 'inventory.failed'
4. Task Assignment ← consumes 'inventory.reserved'
   → finds idle bot → creates task → publishes 'task.assigned' OR 'task.queued'
5. Bot Simulator ← consumes 'task.assigned'
   → simulates movement (dock → shelves → packing → dock)
   → broadcasts position via Supabase Broadcast (500ms ticks)
   → publishes 'bot.pick_completed' when done
6. Packing & Label ← consumes 'bot.pick_completed'
   → creates package + label → publishes 'package.created'
7. Shipping Notification ← consumes 'package.created'
   → generates tracking ID → creates shipment → publishes 'shipment.created'
8. Analytics Dashboard ← consumes ALL events (wildcard '#')
   → logs to event_log table → broadcasts system events
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite | Dashboard UI |
| Animation | Framer Motion | Smooth bot marker transitions |
| Icons | Lucide React | Consistent iconography |
| Database | Supabase (PostgreSQL) | Persistent data storage |
| Auth | Supabase Auth | JWT-based admin/viewer roles |
| Realtime (CDC) | Supabase Realtime | Order/bot/inventory state changes → frontend |
| Realtime (Ephemeral) | Supabase Broadcast | High-frequency bot position updates |
| Messaging | RabbitMQ (Topic Exchange) | Inter-service async communication |
| Backend | Node.js + Express | 7 microservices |
| Containers | Docker Compose | Local orchestration |
| Deployment | Vercel (frontend) + AWS ECS (backend) | Production hosting |

## Database Schema

```
orders ──┐
         ├── order_items (1:N)
         ├── tasks (1:1) ──── bots (N:1)
         ├── packages (1:1)
         └── shipments (1:1) ── packages (1:1)

inventory (standalone, keyed by SKU)
event_log (append-only, for analytics)
profiles (1:1 with auth.users, for RBAC)
```

## RabbitMQ Exchange Design

- **Exchange**: `warepick.events` (type: `topic`, durable)
- **Routing keys**: `{entity}.{action}` (e.g., `order.created`, `bot.pick_completed`)
- **Queue naming**: `{service-name}.{event-name}` (e.g., `inventory-check.order-created`)
- **Analytics**: Uses wildcard `#` binding to receive ALL events

## Supabase Realtime Strategy

| Data Type | Method | Latency | Persisted? |
|-----------|--------|---------|------------|
| Bot positions (500ms) | Broadcast | 6-50ms | No (ephemeral) |
| Order status changes | Postgres CDC | 50-200ms | Yes |
| Inventory levels | Postgres CDC | 50-200ms | Yes |
| Bot state changes | Postgres CDC | 50-200ms | Yes |
| System events | Broadcast | 6-50ms | Via event_log table |

## Security Model

- **Frontend**: Uses `anon` key → respects RLS policies
- **Backend Services**: Use `service_role` key → bypasses RLS
- **Auth**: Supabase Auth with email/password
- **Roles**: `admin` (full access) and `viewer` (read-only)
- **RLS**: Enabled on all tables with role-based policies
