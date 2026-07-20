/**
 * Inventory Check Service — Entry Point
 */

const express = require('express');
const cors = require('cors');
const { connectRabbitMQ, consume } = require('../../../shared/rabbitmq');
const EVENTS = require('../../../shared/events');
const { SERVICE_NAME, PORT } = require('./config');
const inventoryRoutes = require('./routes/inventory');
const { handleOrderCreated } = require('./consumers/orderCreated');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, uptime: process.uptime() });
});

// Routes
app.use('/inventory', inventoryRoutes);

/**
 * Start RabbitMQ consumers
 */
async function startConsumers() {
  try {
    const { channel } = await connectRabbitMQ(SERVICE_NAME);

    // Consumer: order.created
    const queue = 'inventory-check.order-created';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'warepick.events', EVENTS.ORDER_CREATED);
    channel.prefetch(1);

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handleOrderCreated(data, channel);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error processing ${EVENTS.ORDER_CREATED}:`, err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log(`📥 [${SERVICE_NAME}] Consuming queue: ${queue}`);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] Failed to start consumers:`, err.message);
    setTimeout(startConsumers, 5000);
  }
}

// Start server & consumers
app.listen(PORT, () => {
  console.log(`✅ [${SERVICE_NAME}] Running on port ${PORT}`);
  startConsumers();
});
