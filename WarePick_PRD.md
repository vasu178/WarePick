# WarePick Product Requirements Document

## 1. Product Overview

### Product Name
WarePick

### Product Type
Smart warehouse fulfillment simulator built with an event-driven microservices architecture, featuring a modern real-time mission control UI.

### One-Line Summary
WarePick simulates a warehouse fulfillment pipeline where orders enter the system, inventory is checked, picking tasks are assigned to simulated warehouse bots, packing labels are generated, shipping notifications are sent, and operational metrics are shown in a real-time dashboard powered by Supabase.

### Project Context
WarePick is designed as a university microservices project that demonstrates how modern fulfillment systems can coordinate independent services for order routing, inventory validation, task assignment, warehouse movement, packing, shipping, and analytics. The system is fully software-based and does not require physical robots, hardware sensors, or paid cloud services, though it leverages Supabase for seamless real-time data sync and authentication.

### Core Value Proposition
WarePick gives evaluators a visually understandable, technically credible demonstration of microservice orchestration. Instead of only showing APIs or logs, it presents an animated warehouse floor where simulated bots move to pick items when orders arrive, while backend services communicate through HTTP, message queues, Supabase Postgres CDC (Change Data Capture), and WebSocket broadcast events.

## 2. Goals and Objectives

### Product Goals

1. Demonstrate a realistic warehouse fulfillment workflow from order creation to shipping notification.
2. Implement seven clearly separated microservices with distinct responsibilities running via Docker.
3. Show real-time system behavior through a live warehouse floor UI and analytics dashboard utilizing a unified Forge Command Design System.
4. Use practical, well-documented technologies (Node.js, React, Tailwind CSS, Supabase, RabbitMQ, Docker).
5. Provide enough technical depth for microservices evaluation without depending on external hardware.

### Learning and Evaluation Goals

1. Show service decomposition using bounded contexts.
2. Demonstrate asynchronous communication with a message broker (RabbitMQ).
3. Demonstrate synchronous service calls where appropriate.
4. Leverage Supabase for PostgreSQL, Auth, and Realtime capabilities to reduce boilerplate WebSocket code.
5. Provide observable order status transitions across multiple services.
6. Support a polished final demo that judges can understand without lengthy explanation.

## 3. Target Users

### Primary Users

#### Student Development Team
The students building WarePick need a project that is feasible in 5 to 7 weeks, technically meaningful, and visually impressive enough for a final demonstration.

#### University Evaluators
Evaluators need to see clear evidence of microservice architecture, service communication, event-driven behavior, and practical system design.

### Secondary Users

#### Demo Viewers
Classmates, faculty, and reviewers should be able to understand the system by watching orders move through the dashboard and warehouse floor.

#### Future Developers
Future students or contributors should be able to extend the system with better routing, more advanced analytics, authentication, or additional fulfillment rules.

## 4. Problem Statement

Warehouse fulfillment involves many independent but coordinated steps: receiving orders, checking inventory, assigning pick tasks, moving warehouse workers or robots, packing products, creating labels, shipping packages, and monitoring system performance.

In real systems, these operations are commonly split across independent services because each part has different scaling, data, and reliability needs. A single monolithic application would be simpler to start but would not demonstrate how fulfillment systems coordinate distributed processes.

WarePick solves this project problem by creating a self-contained warehouse simulator. It shows a realistic order fulfillment flow while keeping implementation feasible for a university team, enhanced by a professional-grade UI and modern cloud-native database features.

## 5. Scope

### In Scope

1. Customer order creation through a frontend form or seeded order generator.
2. Order validation and persistence.
3. Inventory availability checks and reservation.
4. Task assignment to available simulated bots.
5. Animated bot movement on a warehouse floor UI (SVG-based).
6. Packing, label generation, and shipping notification.
7. Real-time status updates via Supabase Realtime (CDC and Broadcast).
8. Analytics dashboard for order throughput, service status, and inventory levels.
9. Docker Compose setup for all backend microservices and message broker.
10. Frontend built with React, Tailwind CSS, and the Forge Command Design System (based on Stitch screens).
11. Authentication (Login/Signup) powered by Supabase Auth.

### Out of Scope

1. Physical robots, Raspberry Pi devices, sensors, scanners, or hardware.
2. Real payment processing or shipping carrier integrations.
3. Complex warehouse optimization algorithms as a required feature.
4. Multi-warehouse support.

### Optional Stretch Scope

1. A* or BFS pathfinding around shelves and blocked grid cells.
2. Priority-based order assignment.
3. Offline-mode/Bypass Login capabilities for pure UI testing without a live Supabase project.

## 6. Success Metrics

### Technical Success Metrics

1. All seven microservices run independently through Docker Compose.
2. A new order can complete the full lifecycle from intake to shipping notification.
3. RabbitMQ messages are published and consumed successfully across the fulfillment pipeline.
4. The frontend receives real-time updates seamlessly via Supabase hooks without manual refresh.
5. Supabase PostgreSQL reliably stores orders, inventory, tasks, bots, and event logs.

### Demo Success Metrics

1. Judges can visually see bots moving to shelves when orders arrive.
2. Order status changes are visible in real time across the new 4-page dashboard.
3. The UI feels professional, responsive, and cohesive (Forge Command design).
4. The system can process multiple demo orders in a controlled run.

## 7. Product Experience

### Primary User Flow

1. A user opens the WarePick dashboard and logs in via Supabase Auth (or bypasses).
2. The user navigates via the sidebar to the **Orders** page to create a new order.
3. The Order Intake Service validates and records the order.
4. The Inventory Check Service checks whether requested SKUs are available and reserves them.
5. The Task Assignment Service assigns the order to an available bot.
6. The user navigates to the **Warehouse Floor** page, where the Bot Simulator Service moves the bot across the SVG warehouse UI.
7. When picking completes, the Packing & Label Service creates a package record.
8. The Shipping Notification Service generates a tracking ID.
9. The user navigates to the **Analytics** page to view updated metrics and event logs.

### Alternate Flow: Insufficient Inventory

1. User creates an order.
2. Inventory service detects that one or more SKUs are unavailable.
3. Order status changes to `inventory_failed`.
4. The **Inventory** page highlights the failure in the Event Log.
5. No bot task or shipping notification is created.

## 8. Functional Requirements

### FR-1: Order Creation
The system shall allow users to create orders with customer name, destination, SKU list, quantities, and priority. Valid orders publish an `order.created` event.

### FR-2: Inventory Check
The system shall verify stock availability. Available inventory is reserved before fulfillment continues. Failed checks publish an `inventory.failed` event.

### FR-3: Task Assignment
The system shall assign picking tasks to available warehouse bots, publishing `task.assigned`.

### FR-4: Bot Simulation
The system shall simulate bot movement across a warehouse floor. Movement updates (`bot.position_updated`) are broadcasted via Supabase Realtime at high frequency.

### FR-5: Packing and Label Generation
The system shall generate a packing record and label after picking completes.

### FR-6: Shipping Notification
The system shall generate a tracking ID and shipping notification record.

### FR-7: Analytics Dashboard
The system shall display operational metrics, active bots, system event logs, and microservice ping status.

### FR-8: Real-Time Updates
The system shall push live updates to the frontend via Supabase. Postgres CDC handles state changes (orders, inventory, tasks), while Supabase Broadcast handles ephemeral high-frequency data (bot positions).

## 9. Non-Functional Requirements

### Performance
The system should process a single order through the full flow in under 15 seconds during demo mode. Frontend SVG animations must remain smooth via React/Framer Motion.

### Reliability
Services should log startup status and major events. Message consumers (RabbitMQ) should avoid duplicate processing.

### Maintainability
Docker Compose should make service startup repeatable. The frontend uses Tailwind CSS and a unified design system configuration (`tailwind.config.js`) for rapid styling and consistency.

## 10. Microservices Architecture

WarePick consists of seven microservices, containerized via **Docker** and orchestrated via **Docker Compose**:

1. **Order Intake Service**: Receives new orders, validates payloads, and starts the workflow.
2. **Inventory Check Service**: Checks stock, reserves items, prevents fulfillment for unavailable items.
3. **Task Assignment Service**: Creates and assigns picking tasks to bots.
4. **Bot Simulator Service**: Simulates warehouse bots and emits real-time movement updates.
5. **Packing & Label Service**: Creates package records and mock labels.
6. **Shipping Notification Service**: Generates mock shipping details.
7. **Analytics Dashboard Service**: Aggregates system activity for KPI tracking.

## 11. Technology Stack & Integration

### Backend & Infrastructure
- **Microservices**: Node.js (Express/Fastify)
- **Containerization**: Docker & Docker Compose (handles running all 7 services + RabbitMQ locally)
- **Message Broker**: RabbitMQ (for service-to-service asynchronous events like `order.created`, `inventory.reserved`)
- **Database**: Supabase PostgreSQL (managed cloud Postgres for easy CDC and relations)

### Supabase Integration
Supabase is critical to the architecture, replacing traditional custom WebSockets and raw Postgres connections:
- **Auth**: Provides the Login/Signup flow on the frontend.
- **Database**: Stores all persistent state (orders, inventory, tasks).
- **Realtime (Postgres Changes)**: The frontend subscribes to table changes (CDC) using `useRealtimeTable` hooks. When backend services update an order status in Postgres, the UI updates instantly without polling.
- **Realtime (Broadcast)**: Used for high-frequency, ephemeral data (like bot X/Y coordinates). The Bot Simulator Service publishes to a Supabase Broadcast channel, and the frontend listens via the `useBroadcast` hook, ensuring smooth SVG animation without overloading the database.

### Frontend UI (Stitch Forge Command Design System)
- **Framework**: React + Vite
- **Styling**: Tailwind CSS v3
- **Design System**: "Forge Command" (extracted from Stitch designs). Features a dark, mission-control aesthetic with 40+ semantic color tokens (`primary-container`, `surface-variant`, etc.), specific typography (`Inter` and `JetBrains Mono`), and Material Symbols for icons.
- **Layout**: 4-page architecture with a fixed TopNav, fixed Sidebar, and fixed StatusBar.
  - **Warehouse Floor**: Live SVG map and bot tracking.
  - **Orders**: Creation form and vertical timeline.
  - **Inventory**: KPI cards, SKU directory, and event log.
  - **Analytics**: Sparklines, bot utilization bars, microservice pulse, and raw JSON event feeds.

## 12. Data Model (Supabase Postgres)

- **orders**: id, customer_name, destination, priority, status, created_at, updated_at
- **order_items**: id, order_id, sku, product_name, quantity
- **inventory**: sku, product_name, shelf_code, available_quantity, reserved_quantity, updated_at
- **bots**: id, bot_code, status, x_position, y_position, current_task_id, updated_at
- **tasks**: id, order_id, bot_id, status, source_shelves, assigned_at, completed_at
- **packages**: id, order_id, label_id, status, created_at
- **shipments**: id, order_id, package_id, carrier, tracking_id, notification_status, created_at
- **event_log**: id, event_name, entity_type, entity_id, payload, created_at

## 13. Order Lifecycle States

`created` -> `checking_inventory` -> `inventory_reserved` (or `inventory_failed`) -> `waiting_for_bot` -> `task_assigned` -> `picking` -> `picked` -> `packed` -> `shipped`

## 14. Testing & Verification

1. **Unit Testing**: Validate order payloads and inventory logic.
2. **Integration Testing**: Confirm RabbitMQ events successfully trigger downstream services.
3. **End-to-End Testing**: Submit order from the new React/Tailwind frontend, watch it move through all statuses via Supabase Realtime, confirm bot movement on the SVG floor, and verify Analytics updates.
4. **Offline Resilience**: Ensure the UI can be viewed in "Bypass Login (Offline Mode)" when the Supabase project is paused or unavailable.
