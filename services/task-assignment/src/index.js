/**
 * Task Assignment Service - Entry Point
 */

const express = require('express');
const cors = require('cors');
const { connectRabbitMQ, EXCHANGE } = require('../../shared/rabbitmq');
const EVENTS = require('../../shared/events');
const { SERVICE_NAME, PORT } = require('./config');
const taskRoutes = require('./routes/tasks');
const { handleInventoryReserved } = require('./consumers/inventoryReserved');
const { handleBotAvailable } = require('./consumers/botAvailable');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, uptime: process.uptime() });
});

// Routes
app.use('/tasks', taskRoutes);

/**
 * Set up RabbitMQ consumers
 */
async function startConsumers() {
  try {
    const { channel } = await connectRabbitMQ(SERVICE_NAME);

    // Consumer 1: inventory.reserved
    const inventoryReservedQueue = 'task-assignment.inventory-reserved';
    await channel.assertQueue(inventoryReservedQueue, { durable: true });
    await channel.bindQueue(inventoryReservedQueue, EXCHANGE, EVENTS.INVENTORY_RESERVED);

    channel.consume(inventoryReservedQueue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await handleInventoryReserved(payload, channel);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error processing ${EVENTS.INVENTORY_RESERVED}:`, err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log(`📥 [${SERVICE_NAME}] Consuming queue: ${inventoryReservedQueue}`);

    // Consumer 2: bot.available
    const botAvailableQueue = 'task-assignment.bot-available';
    await channel.assertQueue(botAvailableQueue, { durable: true });
    await channel.bindQueue(botAvailableQueue, EXCHANGE, EVENTS.BOT_AVAILABLE);

    channel.consume(botAvailableQueue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await handleBotAvailable(payload, channel);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error processing ${EVENTS.BOT_AVAILABLE}:`, err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log(`📥 [${SERVICE_NAME}] Consuming queue: ${botAvailableQueue}`);
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
