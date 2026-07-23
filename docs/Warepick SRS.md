 # Software Requirements Specification (SRS)
## Project Name: WarePick

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to specify the software requirements for **WarePick**, a smart warehouse fulfillment simulator. This document provides a comprehensive overview of the system's architecture, functional and non-functional requirements, and future improvements. It is intended for student developers, university evaluators, and future contributors.

### 1.2 Scope
WarePick is an event-driven microservices-based application simulating a warehouse fulfillment pipeline. The system handles the entire lifecycle of an order: from intake, inventory validation, and bot task assignment, to picking simulation, packing, and shipping notifications. It features a modern, real-time mission control UI utilizing a "Forge Command" glassmorphic design system and an interactive 3D warehouse map. The project serves as an educational and demonstration tool for microservice orchestration and event-driven architectures without requiring physical robots or hardware.

### 1.3 Definitions, Acronyms, and Abbreviations
- **CDC**: Change Data Capture (via Supabase Realtime).
- **KPI**: Key Performance Indicator.
- **SKU**: Stock Keeping Unit.
- **SRS**: Software Requirements Specification.
- **UI/UX**: User Interface / User Experience.
- **JWT**: JSON Web Token (used for Supabase Auth).
- **RBAC**: Role-Based Access Control.

---

## 2. Overall Description

### 2.1 Product Perspective
WarePick operates as an independent web application. It relies on a suite of seven containerized Node.js microservices coordinated via RabbitMQ for message brokering and Supabase for cloud PostgreSQL data storage, authentication, and real-time state synchronization.

### 2.2 User Classes and Characteristics
1. **Student Developers:** Require a clear, maintainable architecture to learn microservices, event-driven design, and modern frontend tools.
2. **Evaluators/Judges:** Require a highly visual, credible demonstration of backend orchestration through a polished frontend dashboard.
3. **End-Users (Simulated Admins):** Interact with the dashboard to create orders, restock inventory, and monitor system health.

### 2.3 Operating Environment
- **Client Side:** Modern web browsers (Chrome, Firefox, Safari, Edge) supporting React 19, SVG/Canvas/WebGL (Three.js), and WebSockets.
- **Server Side:** Docker and Docker Compose environment capable of running Node.js 20+ containers and RabbitMQ.
- **Cloud Dependency:** Active Supabase project for PostgreSQL, Auth, and Realtime Broadcast/CDC services.

---

## 3. System Features & Functional Requirements

### 3.1 Order Intake Service
- **Description:** Receives new orders from the frontend, validates the payload, and initiates the fulfillment workflow.
- **FR-1.1:** The system shall allow users to submit orders containing customer name, destination, priority, and a list of SKUs and quantities.
- **FR-1.2:** Validated orders shall be persisted to the database with a `created` status.
- **FR-1.3:** The service shall publish an `order.created` event to RabbitMQ.

### 3.2 Inventory Check Service
- **Description:** Verifies that requested SKUs are in stock and reserves them.
- **FR-2.1:** The system shall check current `available_quantity` against the order's requested quantities.
- **FR-2.2:** If stock is sufficient, the system shall deduct from `available_quantity`, add to `reserved_quantity`, and publish `inventory.reserved`.
- **FR-2.3:** If stock is insufficient, the order status shall be updated to `inventory_failed`, and an `inventory.failed` event shall be published.

### 3.3 Task Assignment Service
- **Description:** Assigns picking tasks to available warehouse bots.
- **FR-3.1:** The system shall locate an `idle` bot and assign it the order, updating the bot's status to `assigned`.
- **FR-3.2:** The system shall generate a task record mapping the order to the bot and publish `task.assigned`.

### 3.4 Bot Simulator Service
- **Description:** Simulates the physical movement of bots across the warehouse floor.
- **FR-4.1:** The system shall simulate bot movement between the receiving dock, designated shelves, the packing station, and back.
- **FR-4.2:** The service shall broadcast high-frequency positional updates (X/Y coordinates) via Supabase Broadcast channels every 500ms.
- **FR-4.3:** Upon task completion, the system shall publish `bot.pick_completed`.

### 3.5 Packing & Label Service
- **Description:** Handles the packing process and label generation.
- **FR-5.1:** The system shall create a package record linked to the order upon receiving `bot.pick_completed`.
- **FR-5.2:** The system shall publish `package.created`.

### 3.6 Shipping Notification Service
- **Description:** Finalizes the order by dispatching simulated shipping details.
- **FR-6.1:** The system shall generate a mock tracking ID and update the order status to `shipped`.
- **FR-6.2:** The system shall publish `shipment.created`.

### 3.7 Analytics Dashboard Service
- **Description:** Aggregates system events for real-time KPI tracking.
- **FR-7.1:** The system shall consume a wildcard `#` binding on RabbitMQ to log all system events into the `event_log` table.
- **FR-7.2:** The system shall compute real-time metrics including total orders, in-progress orders, failed orders, shipped orders, and bot utilization.

---

## 4. UI/UX Requirements

### 4.1 Design System
- **UR-1.1:** The frontend shall utilize the "Forge Command" design system, characterized by a dark theme, mission-control aesthetic, and Tailwind CSS configuration.
- **UR-1.2:** UI components (cards, dropdowns, navigation) shall implement **Glassmorphism**, defined by semi-transparent frosted glass (`backdrop-blur`), subtle white borders, and dynamic drop shadows.

### 4.2 Dashboard Modules
- **Warehouse Floor:** An interactive, 3D/Isometric view (or high-fidelity 2D) of the warehouse grid mapping bot movements in real-time.
- **Orders Page:** A control center to create new orders and view a live vertical timeline of order state transitions.
- **Inventory Page:** Real-time stock levels, low-stock alerts, and quick restock controls.
- **Analytics Page:** KPI summaries, microservice health status pulses, and a live raw event feed.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-1.1:** A single order shall complete the full simulated fulfillment lifecycle in under 15 seconds.
- **NFR-1.2:** Frontend animations based on Supabase Broadcast data shall remain smooth (targeting 60fps) without overwhelming the client CPU.

### 5.2 Reliability & Scalability
- **NFR-2.1:** Microservices shall automatically attempt to reconnect to RabbitMQ and Supabase upon startup or connection loss.
- **NFR-2.2:** Message queues shall be durable to ensure events are not lost if a service crashes.

### 5.3 Security
- **NFR-3.1:** All frontend database interactions shall be restricted by Supabase Row Level Security (RLS) policies.
- **NFR-3.2:** The system shall support Supabase Auth with JWT-based role definitions (`admin`, `viewer`).

---

## 6. Future Features and Improvements

As the WarePick system evolves beyond its initial university project scope, the following improvements are planned:

### 6.1 Advanced Pathfinding & Optimization
- **A* Algorithm Integration:** Replace current linear/Manhattan bot movement with intelligent A* pathfinding that routes bots around obstacles, other bots, and blocked aisles.
- **Multi-Order Picking (Batching):** Allow a single bot to pick multiple orders simultaneously to optimize travel distance.
- **Dynamic Prioritization:** Implement dynamic queueing where high-priority or express shipping orders cut the line in task assignment.

### 6.2 Enhanced Simulation & 3D Visualization
- **Full Three.js Integration:** Expand the current Canvas/SVG map into a fully interactive 3D WebGL environment with pan, zoom, and rotating camera controls.
- **Physical Collision Physics:** Introduce simulated bot traffic jams and collision avoidance systems.

### 6.3 External System Integrations
- **Payment Processing Mock:** Integrate Stripe test mode to simulate payment holds and captures before an order proceeds to inventory checking.
- **Carrier API Integrations:** Replace mock tracking IDs with sandbox API calls to UPS, FedEx, or Shippo for realistic label generation and tracking updates.

### 6.4 Advanced Analytics & Machine Learning
- **Predictive Restocking:** Implement a lightweight ML model that forecasts inventory depletion and automatically suggests restock quantities.
- **Bottleneck Analysis:** Add heatmaps to the analytics dashboard showing areas of high bot traffic or microservice latency.

### 6.5 Enterprise Architecture Features
- **Multi-Warehouse Support:** Extend the database schema and routing logic to support orders distributed across multiple warehouse zones or distinct geographic facilities.
- **Kubernetes Deployment:** Migrate from Docker Compose to a fully orchestrated Kubernetes (K8s) deployment utilizing Helm charts for production-grade scaling and self-healing.
- **Offline UI Bypass:** Create a robust local-only mock mode utilizing MSW (Mock Service Worker) to demonstrate the UI entirely offline without requiring a live Supabase connection.
