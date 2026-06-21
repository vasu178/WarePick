# WarePick API Contracts

All backend services expose REST endpoints and communicate via RabbitMQ messages.

## Service Endpoints

### Order Intake Service (`:3001`)

| Method | Path | Description | Body |
|--------|------|-------------|------|
| GET | `/health` | Health check | — |
| POST | `/orders` | Create order | `{ customerName, destination, priority?, items: [{sku, quantity}] }` |
| GET | `/orders` | List all orders | — |
| GET | `/orders/:id` | Get order by ID | — |
| PATCH | `/orders/:id/status` | Update order status | `{ status }` |
| POST | `/orders/demo` | Create 1 random order | — |
| POST | `/orders/demo/batch` | Create multiple random orders | `{ count? }` (default: 10) |
| POST | `/orders/reset` | Full system reset | — |

### Inventory Check Service (`:3002`)

| Method | Path | Description | Body |
|--------|------|-------------|------|
| GET | `/health` | Health check | — |
| GET | `/inventory` | List all SKUs | — |
| GET | `/inventory/:sku` | Get SKU details | — |
| PATCH | `/inventory/:sku` | Update quantity | `{ available_quantity?, reserved_quantity? }` |
| POST | `/inventory/reset` | Reset to seed quantities | — |

### Task Assignment Service (`:3003`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/:id` | Get task details |

### Bot Simulator Service (`:3004`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/bots` | List all bots |
| GET | `/bots/:id` | Get bot state |
| POST | `/bots/reset` | Reset all bots to dock |

### Packing & Label Service (`:3005`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/packages` | List all packages |
| GET | `/packages/:id` | Get package details |
| GET | `/packages/:id/label` | Get package label |

### Shipping Notification Service (`:3006`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/shipments` | List all shipments |
| GET | `/shipments/:id` | Get shipment details |

### Analytics Dashboard Service (`:3007`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/analytics/summary` | KPI summary (orders, bots, avg time) |
| GET | `/analytics/events` | Recent event log (`?limit=50`) |
| GET | `/analytics/orders` | Order lifecycle metrics |
| GET | `/analytics/bots` | Bot utilization stats |

---

## RabbitMQ Message Contracts

**Exchange**: `warepick.events` (type: `topic`, durable: `true`)

### `order.created`
```json
{
  "eventName": "order.created",
  "orderId": "uuid",
  "customerName": "string",
  "destination": "string",
  "priority": "normal|high",
  "items": [{ "sku": "string", "quantity": 1, "productName": "string" }],
  "createdAt": "ISO-8601"
}
```

### `inventory.reserved`
```json
{
  "eventName": "inventory.reserved",
  "orderId": "uuid",
  "items": [{ "sku": "string", "quantity": 1, "shelfCode": "A1", "productName": "string" }],
  "createdAt": "ISO-8601"
}
```

### `inventory.failed`
```json
{
  "eventName": "inventory.failed",
  "orderId": "uuid",
  "reason": "string",
  "failedItems": [{ "sku": "string", "requested": 3, "available": 1, "reason": "string" }],
  "createdAt": "ISO-8601"
}
```

### `task.assigned`
```json
{
  "eventName": "task.assigned",
  "taskId": "uuid",
  "orderId": "uuid",
  "botId": "uuid",
  "botCode": "BOT-01",
  "sourceShelves": ["A1", "B2"],
  "destinationZone": "PACKING",
  "createdAt": "ISO-8601"
}
```

### `task.queued`
```json
{
  "eventName": "task.queued",
  "taskId": "uuid",
  "orderId": "uuid",
  "reason": "No idle bot available",
  "createdAt": "ISO-8601"
}
```

### `bot.position_updated` (Supabase Broadcast only)
```json
{
  "botId": "uuid",
  "botCode": "BOT-01",
  "x": 5,
  "y": 7,
  "status": "picking",
  "taskId": "uuid|null",
  "timestamp": 1718900000000
}
```

### `bot.pick_completed`
```json
{
  "eventName": "bot.pick_completed",
  "botId": "uuid",
  "botCode": "BOT-01",
  "taskId": "uuid",
  "orderId": "uuid",
  "createdAt": "ISO-8601"
}
```

### `bot.available`
```json
{
  "eventName": "bot.available",
  "botId": "uuid",
  "botCode": "BOT-01",
  "createdAt": "ISO-8601"
}
```

### `package.created`
```json
{
  "eventName": "package.created",
  "packageId": "uuid",
  "orderId": "uuid",
  "labelId": "LBL-20260620-0042",
  "createdAt": "ISO-8601"
}
```

### `shipment.created`
```json
{
  "eventName": "shipment.created",
  "shipmentId": "uuid",
  "orderId": "uuid",
  "packageId": "uuid",
  "carrier": "WarePick Express",
  "trackingId": "WPK-20260620-0042",
  "createdAt": "ISO-8601"
}
```
