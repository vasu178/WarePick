# WarePick Product Requirements Document

## 1. Product Overview

### Product Name
WarePick

### Product Type
Smart warehouse fulfillment simulator built with an event-driven microservices architecture.

### One-Line Summary
WarePick simulates a warehouse fulfillment pipeline where orders enter the system, inventory is checked, picking tasks are assigned to simulated warehouse bots, packing labels are generated, shipping notifications are sent, and operational metrics are shown in a real-time dashboard.

### Project Context
WarePick is designed as a university microservices project that demonstrates how modern fulfillment systems can coordinate independent services for order routing, inventory validation, task assignment, warehouse movement, packing, shipping, and analytics. The system is fully software-based and does not require physical robots, hardware sensors, external APIs, or paid cloud services.

### Core Value Proposition
WarePick gives evaluators a visually understandable, technically credible demonstration of microservice orchestration. Instead of only showing APIs or logs, it presents an animated warehouse floor where simulated bots move to pick items when orders arrive, while backend services communicate through HTTP, message queues, database updates, and WebSocket events.

## 2. Goals and Objectives

### Product Goals

1. Demonstrate a realistic warehouse fulfillment workflow from order creation to shipping notification.
2. Implement seven clearly separated microservices with distinct responsibilities.
3. Show real-time system behavior through a live warehouse floor UI and analytics dashboard.
4. Use practical, well-documented technologies that can run locally through Docker Compose.
5. Provide enough technical depth for microservices evaluation without depending on external hardware or third-party APIs.

### Learning and Evaluation Goals

1. Show service decomposition using bounded contexts.
2. Demonstrate asynchronous communication with a message broker.
3. Demonstrate synchronous service calls where appropriate.
4. Use a shared database only where justified, while avoiding tightly coupled service logic.
5. Show real-time updates through WebSocket communication.
6. Provide observable order status transitions across multiple services.
7. Support a polished final demo that judges can understand without lengthy explanation.

## 3. Target Users

### Primary Users

#### Student Development Team
The students building WarePick need a project that is feasible in 5 to 7 weeks, technically meaningful, and visually impressive enough for a final demonstration.

#### University Evaluators
Evaluators need to see clear evidence of microservice architecture, service communication, database use, event-driven behavior, and practical system design.

### Secondary Users

#### Demo Viewers
Classmates, faculty, and reviewers should be able to understand the system by watching orders move through the dashboard and warehouse floor.

#### Future Developers
Future students or contributors should be able to extend the system with better routing, more advanced analytics, authentication, or additional fulfillment rules.

## 4. Problem Statement

Warehouse fulfillment involves many independent but coordinated steps: receiving orders, checking inventory, assigning pick tasks, moving warehouse workers or robots, packing products, creating labels, shipping packages, and monitoring system performance.

In real systems, these operations are commonly split across independent services because each part has different scaling, data, and reliability needs. A single monolithic application would be simpler to start but would not demonstrate how fulfillment systems coordinate distributed processes.

WarePick solves this project problem by creating a self-contained warehouse simulator. It shows a realistic order fulfillment flow while keeping implementation feasible for a university team.

## 5. Scope

### In Scope

1. Customer order creation through a frontend form or seeded order generator.
2. Order validation and persistence.
3. Inventory availability checks.
4. Inventory reservation after a successful stock check.
5. Task assignment to available simulated bots.
6. Animated bot movement on a warehouse floor UI.
7. Packing and label generation after picking completes.
8. Shipping notification generation with tracking ID.
9. Real-time status updates through WebSockets.
10. Analytics dashboard for order throughput, service status, inventory levels, and fulfillment states.
11. Docker Compose setup for all services, database, message broker, and frontend.
12. Local development environment using Node.js, React, PostgreSQL, RabbitMQ, and WebSocket communication.

### Out of Scope

1. Physical robots, Raspberry Pi devices, sensors, scanners, or hardware.
2. Real payment processing.
3. Real shipping carrier integrations.
4. Real email or SMS delivery.
5. Production authentication and authorization.
6. Complex warehouse optimization algorithms as a required feature.
7. Multi-warehouse support.
8. Cloud deployment as a required project deliverable.
9. Advanced machine learning demand forecasting.

### Optional Stretch Scope

1. A* or BFS pathfinding around shelves and blocked grid cells.
2. Priority-based order assignment.
3. Low-stock alerts.
4. CSV import for inventory.
5. Demo load mode that creates 10 to 20 simultaneous orders.
6. Admin controls for pausing bots or changing bot availability.
7. Basic role-based login for admin and viewer users.

## 6. Success Metrics

### Technical Success Metrics

1. All seven microservices run independently through Docker Compose.
2. A new order can complete the full lifecycle from intake to shipping notification.
3. Each major workflow step is handled by the correct service.
4. RabbitMQ messages are published and consumed successfully across the fulfillment pipeline.
5. The frontend receives real-time updates without manual refresh.
6. PostgreSQL stores orders, inventory, tasks, bots, packing labels, shipping records, and analytics-relevant event records.
7. The system continues functioning when multiple orders are submitted at once.

### Demo Success Metrics

1. Judges can visually see bots moving to shelves when orders arrive.
2. Order status changes are visible in real time.
3. The architecture diagram maps clearly to running services.
4. The team can explain why each microservice exists.
5. The system can process at least 10 demo orders in a controlled run.

## 7. Product Experience

### Primary User Flow

1. A user opens the WarePick dashboard.
2. The user creates a new order or starts demo order generation.
3. The Order Intake Service validates and records the order.
4. The Inventory Check Service checks whether requested SKUs are available.
5. If inventory is available, items are reserved and a picking request is created.
6. The Task Assignment Service assigns the order to an available bot.
7. The Bot Simulator Service moves the bot across the warehouse floor UI.
8. When picking completes, the Packing & Label Service creates a package record and label.
9. The Shipping Notification Service generates a tracking ID and notification record.
10. The Analytics Dashboard Service updates metrics and order history.
11. The user sees the order marked as shipped.

### Alternate Flow: Insufficient Inventory

1. User creates an order.
2. Inventory service detects that one or more SKUs are unavailable.
3. Order status changes to `inventory_failed`.
4. Dashboard shows the failed order and unavailable SKUs.
5. No bot task, packing label, or shipping notification is created.

### Alternate Flow: No Bot Available

1. Inventory check succeeds.
2. Task Assignment Service finds no available bot.
3. Order enters `waiting_for_bot` status.
4. When a bot becomes available, assignment resumes.
5. Dashboard shows the order as queued until a bot is assigned.

### Alternate Flow: Packing or Shipping Failure

1. Bot completes picking.
2. Packing or shipping service returns an error.
3. Order status changes to `fulfillment_error`.
4. Dashboard surfaces the failed stage.
5. Demo reset controls allow the team to retry or clear the order.

## 8. Functional Requirements

### FR-1: Order Creation

The system shall allow users to create orders with customer name, destination, SKU list, quantities, and optional priority.

Acceptance Criteria:

1. User can submit an order from the frontend.
2. Order is stored with a unique order ID.
3. Invalid orders are rejected with a clear message.
4. Valid orders publish an `order.created` event.

### FR-2: Inventory Check

The system shall verify stock availability for each requested SKU.

Acceptance Criteria:

1. Inventory service consumes or receives order details.
2. Service checks quantity available for all SKUs.
3. Available inventory is reserved before fulfillment continues.
4. Failed inventory checks update order status and stop fulfillment.
5. Successful checks publish an `inventory.reserved` event.

### FR-3: Task Assignment

The system shall assign picking tasks to available warehouse bots.

Acceptance Criteria:

1. Task service receives inventory-approved orders.
2. Service selects an available bot.
3. Service creates a picking task with order ID, bot ID, source shelves, and task status.
4. Service publishes `task.assigned`.
5. If no bot is available, the order remains queued.

### FR-4: Bot Simulation

The system shall simulate bot movement across a warehouse floor.

Acceptance Criteria:

1. Bot positions are represented on a grid-based warehouse layout.
2. Assigned bots move from starting zone to shelves and then to packing zone.
3. Movement updates are visible in the UI.
4. Bot state changes from `idle` to `assigned`, `picking`, `returning`, and `idle`.
5. Completed picks publish `bot.pick_completed`.

### FR-5: Packing and Label Generation

The system shall generate a packing record and label after picking completes.

Acceptance Criteria:

1. Packing service receives pick completion event.
2. Service creates package ID and label ID.
3. Service records packed items.
4. Service updates order status to `packed`.
5. Service publishes `package.created`.

### FR-6: Shipping Notification

The system shall generate a tracking ID and shipping notification record.

Acceptance Criteria:

1. Shipping service receives package creation event.
2. Service generates a mock carrier name and tracking ID.
3. Service stores notification status.
4. Service updates order status to `shipped`.
5. Service publishes `shipment.created`.

### FR-7: Analytics Dashboard

The system shall display operational metrics and live system status.

Acceptance Criteria:

1. Dashboard shows total orders, completed orders, failed orders, queued orders, and average fulfillment time.
2. Dashboard shows inventory levels for each SKU.
3. Dashboard shows active bots and their current statuses.
4. Dashboard shows recent event history.
5. Metrics update in real time or near-real time.

### FR-8: Real-Time Updates

The system shall push live updates to the frontend.

Acceptance Criteria:

1. UI updates order state without page refresh.
2. UI updates bot movement without page refresh.
3. UI updates dashboard metrics when events occur.
4. WebSocket reconnection does not break the page.

### FR-9: Demo Mode

The system shall include a demo mode for generating sample warehouse activity.

Acceptance Criteria:

1. User can generate one sample order.
2. User can generate multiple orders for load demonstration.
3. Demo orders use seeded SKUs and quantities.
4. Demo mode can be reset before a presentation.

## 9. Non-Functional Requirements

### Performance

1. The system should process a single order through the full flow in under 15 seconds during demo mode.
2. The system should handle at least 10 simultaneous demo orders.
3. Frontend animation should remain smooth with at least 10 active bots.

### Reliability

1. Services should log startup status and major events.
2. Failed service calls should return clear errors.
3. Message consumers should avoid duplicate processing where feasible.
4. Demo reset should restore the system to a clean state.

### Maintainability

1. Each service should have its own folder, package file, environment variables, and README.
2. Shared constants should be minimal and carefully managed.
3. API routes and event names should be documented.
4. Docker Compose should make service startup repeatable.

### Usability

1. The dashboard should be understandable at a glance.
2. Order states should use clear labels.
3. Bot movement should visually communicate fulfillment progress.
4. Error states should be visible but not noisy.

### Security

1. No real customer data should be used.
2. Environment variables should not contain real secrets.
3. Demo credentials, if added, should be clearly marked as local-only.

## 10. Microservices

WarePick keeps the same seven microservices:

1. Order Intake Service
2. Inventory Check Service
3. Task Assignment Service
4. Bot Simulator Service
5. Packing & Label Service
6. Shipping Notification Service
7. Analytics Dashboard Service

### 10.1 Order Intake Service

Purpose:
Receives new orders, validates order payloads, creates order records, and starts the fulfillment workflow.

Primary Responsibilities:

1. Accept order creation requests.
2. Validate customer, destination, SKU, and quantity data.
3. Store order with initial status.
4. Publish `order.created`.
5. Expose order lookup endpoints.

Suggested Endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/orders` | Create order |
| GET | `/orders` | List orders |
| GET | `/orders/:id` | Get order details |
| PATCH | `/orders/:id/status` | Internal status update |

Key Events:

1. Publishes `order.created`.
2. Consumes optional `order.status_updated`.

### 10.2 Inventory Check Service

Purpose:
Checks stock availability, reserves stock, and prevents fulfillment for unavailable items.

Primary Responsibilities:

1. Maintain SKU inventory records.
2. Consume `order.created`.
3. Verify stock availability.
4. Reserve inventory for successful orders.
5. Publish inventory success or failure events.

Suggested Endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/inventory` | List SKUs and quantities |
| GET | `/inventory/:sku` | Get one SKU |
| PATCH | `/inventory/:sku` | Update stock for demo/admin use |

Key Events:

1. Consumes `order.created`.
2. Publishes `inventory.reserved`.
3. Publishes `inventory.failed`.

### 10.3 Task Assignment Service

Purpose:
Creates and assigns picking tasks to available simulated bots.

Primary Responsibilities:

1. Consume `inventory.reserved`.
2. Find available bot.
3. Create picking task.
4. Queue orders when no bot is available.
5. Publish task assignment events.

Suggested Endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/tasks` | List tasks |
| GET | `/tasks/:id` | Get task details |
| PATCH | `/tasks/:id/status` | Update task status |

Key Events:

1. Consumes `inventory.reserved`.
2. Consumes `bot.available`.
3. Publishes `task.assigned`.
4. Publishes `task.queued`.

### 10.4 Bot Simulator Service

Purpose:
Simulates warehouse bots and emits real-time movement updates.

Primary Responsibilities:

1. Maintain bot state and position.
2. Consume `task.assigned`.
3. Move bots through warehouse locations.
4. Publish movement and pick completion events.
5. Expose bot state for dashboard use.

Suggested Endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/bots` | List bots |
| GET | `/bots/:id` | Get bot state |
| POST | `/bots/reset` | Reset bot positions |

Key Events:

1. Consumes `task.assigned`.
2. Publishes `bot.position_updated`.
3. Publishes `bot.pick_completed`.
4. Publishes `bot.available`.

### 10.5 Packing & Label Service

Purpose:
Creates package records and mock labels after picking is complete.

Primary Responsibilities:

1. Consume `bot.pick_completed`.
2. Create package record.
3. Generate mock label ID.
4. Mark order as packed.
5. Publish package event.

Suggested Endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/packages` | List packages |
| GET | `/packages/:id` | Get package details |
| GET | `/packages/:id/label` | Get mock label data |

Key Events:

1. Consumes `bot.pick_completed`.
2. Publishes `package.created`.

### 10.6 Shipping Notification Service

Purpose:
Generates mock shipping details and notification records.

Primary Responsibilities:

1. Consume `package.created`.
2. Generate tracking ID.
3. Select mock carrier.
4. Create shipping notification record.
5. Mark order as shipped.

Suggested Endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/shipments` | List shipments |
| GET | `/shipments/:id` | Get shipment details |
| POST | `/shipments/:id/resend` | Resend mock notification |

Key Events:

1. Consumes `package.created`.
2. Publishes `shipment.created`.

### 10.7 Analytics Dashboard Service

Purpose:
Aggregates system activity and provides dashboard-ready metrics.

Primary Responsibilities:

1. Consume fulfillment events.
2. Track order lifecycle timings.
3. Track inventory and bot summaries.
4. Provide metrics endpoints.
5. Broadcast dashboard updates to frontend.

Suggested Endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/analytics/summary` | Current KPI summary |
| GET | `/analytics/events` | Recent event stream |
| GET | `/analytics/orders` | Order lifecycle metrics |
| GET | `/analytics/bots` | Bot utilization |

Key Events:

1. Consumes `order.created`.
2. Consumes `inventory.reserved`.
3. Consumes `inventory.failed`.
4. Consumes `task.assigned`.
5. Consumes `bot.position_updated`.
6. Consumes `bot.pick_completed`.
7. Consumes `package.created`.
8. Consumes `shipment.created`.

## 11. System Architecture

### Recommended Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend services | Node.js with Express or Fastify |
| Database | PostgreSQL |
| Message broker | RabbitMQ |
| Real-time updates | WebSocket or Socket.IO |
| Containerization | Docker Compose |
| API testing | Postman or Thunder Client |
| Version control | Git and GitHub |

### Communication Pattern

WarePick should use a hybrid communication model:

1. Frontend to backend: HTTP REST APIs.
2. Service-to-service workflow events: RabbitMQ.
3. Live UI updates: WebSocket.
4. Data persistence: PostgreSQL.

### High-Level Event Flow

```text
Frontend
  -> Order Intake Service
  -> order.created
  -> Inventory Check Service
  -> inventory.reserved
  -> Task Assignment Service
  -> task.assigned
  -> Bot Simulator Service
  -> bot.pick_completed
  -> Packing & Label Service
  -> package.created
  -> Shipping Notification Service
  -> shipment.created
  -> Analytics Dashboard Service
  -> WebSocket updates to Frontend
```

## 12. Data Model

### orders

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| customer_name | Text | Demo customer name |
| destination | Text | Mock delivery address or city |
| priority | Text | `normal`, `high` |
| status | Text | Current lifecycle state |
| created_at | Timestamp | Order creation time |
| updated_at | Timestamp | Last status update |

### order_items

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| order_id | UUID | Related order |
| sku | Text | Product SKU |
| product_name | Text | Display name |
| quantity | Integer | Requested quantity |

### inventory

| Field | Type | Notes |
|---|---|---|
| sku | Text | Primary key |
| product_name | Text | Item name |
| shelf_code | Text | Warehouse shelf location |
| available_quantity | Integer | Available stock |
| reserved_quantity | Integer | Reserved stock |
| updated_at | Timestamp | Last inventory update |

### bots

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| bot_code | Text | Human-readable bot ID |
| status | Text | `idle`, `assigned`, `picking`, `returning`, `offline` |
| x_position | Integer | Warehouse grid X |
| y_position | Integer | Warehouse grid Y |
| current_task_id | UUID | Nullable |
| updated_at | Timestamp | Last movement or status update |

### tasks

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| order_id | UUID | Related order |
| bot_id | UUID | Assigned bot |
| status | Text | `queued`, `assigned`, `picking`, `completed`, `failed` |
| source_shelves | JSON | Shelves to visit |
| assigned_at | Timestamp | Assignment time |
| completed_at | Timestamp | Completion time |

### packages

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| order_id | UUID | Related order |
| label_id | Text | Mock label ID |
| status | Text | `created`, `ready_for_shipping` |
| created_at | Timestamp | Package creation time |

### shipments

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| order_id | UUID | Related order |
| package_id | UUID | Related package |
| carrier | Text | Mock carrier |
| tracking_id | Text | Mock tracking number |
| notification_status | Text | `created`, `sent`, `failed` |
| created_at | Timestamp | Shipment creation time |

### event_log

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| event_name | Text | Event type |
| entity_type | Text | `order`, `task`, `bot`, etc. |
| entity_id | UUID | Related entity |
| payload | JSON | Event data |
| created_at | Timestamp | Event time |

## 13. Order Lifecycle States

| Status | Meaning |
|---|---|
| `created` | Order accepted by Order Intake Service |
| `checking_inventory` | Inventory validation in progress |
| `inventory_failed` | One or more SKUs unavailable |
| `inventory_reserved` | Stock reserved successfully |
| `waiting_for_bot` | No bot currently available |
| `task_assigned` | Bot assigned to pick the order |
| `picking` | Bot is moving through warehouse |
| `picked` | Bot completed picking |
| `packed` | Package and label created |
| `shipped` | Mock shipment created |
| `fulfillment_error` | Error occurred in downstream process |

## 14. Frontend Requirements

### Main Screens

#### Warehouse Floor

The warehouse floor should be the most visually important screen. It should show shelves, packing zone, dispatch area, bot locations, and active order movement.

Required Elements:

1. Grid-based warehouse layout.
2. Shelf blocks labeled with shelf codes.
3. Bot icons or markers with bot IDs.
4. Visual movement from idle zone to shelf to packing zone.
5. Active order panel.
6. Color-coded bot states.

#### Order Control Panel

Required Elements:

1. Create order form.
2. SKU and quantity selector.
3. Submit order button.
4. Generate demo order button.
5. Generate load test orders button.
6. Reset demo button.

#### Order Timeline

Required Elements:

1. List of recent orders.
2. Current status for each order.
3. Time spent in each stage where available.
4. Failed inventory or fulfillment state indicators.

#### Analytics Dashboard

Required Elements:

1. Total orders.
2. Orders in progress.
3. Orders shipped.
4. Failed orders.
5. Average fulfillment time.
6. Bot utilization.
7. Inventory levels.
8. Recent event feed.

### UI Design Direction

1. The UI should feel like an operational warehouse command center.
2. Use a clear dashboard layout with dense but readable information.
3. Avoid marketing-style hero sections.
4. Keep the warehouse floor visible as the main demo centerpiece.
5. Use restrained colors with strong status signaling.
6. Make real-time movement and order progress easy to understand without explanation.

## 15. API and Event Contracts

### Sample Order Payload

```json
{
  "customerName": "Demo Customer",
  "destination": "Delhi",
  "priority": "normal",
  "items": [
    {
      "sku": "SKU-1001",
      "quantity": 2
    },
    {
      "sku": "SKU-1003",
      "quantity": 1
    }
  ]
}
```

### Sample `order.created` Event

```json
{
  "eventId": "evt-001",
  "eventName": "order.created",
  "orderId": "ord-001",
  "priority": "normal",
  "items": [
    {
      "sku": "SKU-1001",
      "quantity": 2
    }
  ],
  "createdAt": "2026-06-02T14:00:00Z"
}
```

### Sample `task.assigned` Event

```json
{
  "eventId": "evt-003",
  "eventName": "task.assigned",
  "taskId": "task-001",
  "orderId": "ord-001",
  "botId": "bot-01",
  "sourceShelves": ["A1", "B3"],
  "destinationZone": "PACKING",
  "createdAt": "2026-06-02T14:01:00Z"
}
```

### Sample `bot.position_updated` Event

```json
{
  "eventId": "evt-004",
  "eventName": "bot.position_updated",
  "botId": "bot-01",
  "taskId": "task-001",
  "x": 4,
  "y": 2,
  "status": "picking",
  "createdAt": "2026-06-02T14:01:05Z"
}
```

### Sample `shipment.created` Event

```json
{
  "eventId": "evt-008",
  "eventName": "shipment.created",
  "orderId": "ord-001",
  "packageId": "pkg-001",
  "carrier": "WarePick Express",
  "trackingId": "WPK-20260602-0001",
  "createdAt": "2026-06-02T14:03:00Z"
}
```

## 16. Demo Data

### Suggested SKUs

| SKU | Product | Shelf | Initial Quantity |
|---|---|---|---|
| SKU-1001 | Wireless Mouse | A1 | 40 |
| SKU-1002 | USB-C Cable | A2 | 80 |
| SKU-1003 | Keyboard | B1 | 35 |
| SKU-1004 | Laptop Stand | B2 | 25 |
| SKU-1005 | Headphones | C1 | 30 |
| SKU-1006 | Power Bank | C2 | 50 |

### Suggested Bots

| Bot Code | Start Zone | Initial Status |
|---|---|---|
| BOT-01 | Dock | Idle |
| BOT-02 | Dock | Idle |
| BOT-03 | Dock | Idle |
| BOT-04 | Dock | Idle |
| BOT-05 | Dock | Idle |

## 17. Build Plan

### Week 1: Foundations

Deliverables:

1. Repository structure.
2. Docker Compose setup.
3. PostgreSQL container.
4. RabbitMQ container.
5. Service skeletons.
6. Basic health check endpoints.
7. Initial database schema.

### Week 2: Order and Inventory

Deliverables:

1. Order Intake Service.
2. Inventory Check Service.
3. Order creation UI.
4. Seed inventory data.
5. `order.created`, `inventory.reserved`, and `inventory.failed` events.
6. Basic order list in frontend.

### Week 3: Task Assignment and Bot Service

Deliverables:

1. Task Assignment Service.
2. Bot Simulator Service.
3. Bot state database table.
4. Task assignment event flow.
5. Simple bot movement simulation.
6. Warehouse floor first version.

### Week 4: Real-Time UI and Packing

Deliverables:

1. WebSocket gateway or Socket.IO setup.
2. Live bot movement updates.
3. Packing & Label Service.
4. Package records and label generation.
5. Improved order timeline.

### Week 5: Shipping and Analytics

Deliverables:

1. Shipping Notification Service.
2. Mock tracking ID generation.
3. Analytics Dashboard Service.
4. KPI cards and event feed.
5. Inventory and bot utilization summaries.

### Week 6: Polish and Demo Preparation

Deliverables:

1. Demo mode.
2. Reset mode.
3. Load test mode.
4. Error handling improvements.
5. Architecture diagram.
6. Final documentation.
7. Presentation rehearsal.

## 18. Team Responsibilities

### Two-Person Team

Person 1:

1. Frontend dashboard.
2. Warehouse animation.
3. WebSocket integration.
4. Demo controls.

Person 2:

1. Backend services.
2. PostgreSQL schema.
3. RabbitMQ event flow.
4. Docker Compose.

### Three-Person Team

Person 1:

1. Frontend dashboard.
2. Warehouse UI.
3. Demo experience.

Person 2:

1. Order, inventory, and task services.
2. Database schema.
3. API contracts.

Person 3:

1. Bot, packing, shipping, and analytics services.
2. RabbitMQ integration.
3. WebSocket event broadcasting.

### Four-Person Team

Person 1:

1. Frontend and UX.
2. Real-time dashboard.

Person 2:

1. Order and inventory services.
2. Database design.

Person 3:

1. Task assignment and bot simulation.
2. Movement algorithm.

Person 4:

1. Packing, shipping, analytics.
2. Docker, testing, documentation.

## 19. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| RabbitMQ setup takes longer than expected | Delays service integration | Start message broker setup in week 1 |
| Too many services become hard to coordinate | Medium to high complexity | Use simple service contracts and clear event names |
| Bot pathfinding becomes time-consuming | UI delay | Start with straight-line movement, add pathfinding only as stretch |
| Docker networking causes local issues | Startup problems | Document ports, env vars, and startup order |
| Frontend animation stutters under load | Weak demo experience | Use CSS transitions for simple movement |
| Inventory edge cases create confusing failures | Demo instability | Seed reliable demo data and add reset mode |
| Analytics becomes too broad | Scope creep | Track only core KPIs first |

## 20. Testing Requirements

### Unit Testing

1. Validate order payloads.
2. Validate inventory reservation rules.
3. Validate bot assignment logic.
4. Validate tracking ID generation.

### Integration Testing

1. Order creation publishes correct event.
2. Inventory service consumes order event.
3. Task service assigns a bot after inventory reservation.
4. Bot service publishes pick completion.
5. Packing service creates package after pick completion.
6. Shipping service creates shipment after package creation.

### End-to-End Testing

1. Submit order from frontend.
2. Watch order move through all statuses.
3. Confirm bot movement appears in warehouse UI.
4. Confirm package and shipment records are created.
5. Confirm analytics update after order completion.

### Demo Testing

1. Reset system.
2. Generate one order.
3. Generate 10 simultaneous orders.
4. Trigger insufficient inventory case.
5. Confirm no page refresh is needed.
6. Confirm all services start cleanly from Docker Compose.

## 21. Documentation Requirements

The final project should include:

1. Project README.
2. Architecture diagram.
3. Service responsibility table.
4. API documentation.
5. Event contract documentation.
6. Database schema diagram.
7. Docker Compose instructions.
8. Demo script.
9. Known limitations.
10. Future improvements.

## 22. Demo Script

### Opening

"WarePick is a smart warehouse fulfillment simulator. It shows how independent microservices coordinate order intake, inventory checking, task assignment, bot picking, packing, shipping, and analytics."

### Step 1: Show Architecture

Briefly show the seven services and explain that each service owns a clear part of the fulfillment pipeline.

### Step 2: Create an Order

Submit a sample order from the dashboard. Point out that the order starts in the Order Intake Service.

### Step 3: Show Inventory Check

Show the order status changing after inventory is reserved. Mention that unavailable stock would stop the flow.

### Step 4: Show Bot Assignment

Show a bot becoming assigned to the order. Point out that this is handled by the Task Assignment Service.

### Step 5: Show Warehouse Movement

Watch the bot move to the shelf and then to the packing area. This is the main visual showcase.

### Step 6: Show Packing and Shipping

Show package label creation and mock tracking ID generation.

### Step 7: Show Analytics

Show updated order count, fulfillment time, bot utilization, and event history.

### Step 8: Load Demo

Generate multiple orders and show multiple bots working at once.

## 23. MVP Definition

WarePick MVP is complete when:

1. All seven services can run locally.
2. A valid order completes the full flow from creation to shipment.
3. An invalid inventory case stops correctly.
4. A bot visibly moves on the warehouse floor.
5. The dashboard updates order status in real time.
6. The analytics view shows at least five useful metrics.
7. Docker Compose can start the system from a clean machine.
8. The team can complete a live demo in under 10 minutes.

## 24. Future Enhancements

1. Smarter pathfinding around shelves.
2. Multiple warehouse zones.
3. Priority order routing.
4. Bot battery simulation.
5. Admin login.
6. Inventory import and export.
7. Carrier API integration.
8. Email notification integration.
9. Predictive stock alerts.
10. Historical analytics charts.

## 25. Final Recommendation

WarePick is highly feasible for a 2 to 4 person university team because it is fully software-based, visually demonstrable, and technically rich. The seven microservices are justified by the fulfillment workflow, and the real-time warehouse floor gives the project a strong showcase moment.

The recommended implementation path is to complete the event-driven order pipeline first, then polish the warehouse animation and analytics dashboard. Advanced pathfinding and extra admin features should remain optional until the core microservice chain is reliable.
