/**
 * Bot Simulator Service — Entry Point
 */

const express = require('express');
const cors = require('cors');
const { connectRabbitMQ } = require('../../shared/rabbitmq');
const EVENTS = require('../../shared/events');
const { SERVICE_NAME, PORT } = require('./config');
const botRoutes = require('./routes/bots');
const { handleTaskAssigned } = require('./consumers/taskAssigned');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, uptime: process.uptime() });
});

// Routes
app.use('/bots', botRoutes);

/**
 * Start RabbitMQ consumers
 */
async function startConsumers() {
  try {
    const { channel } = await connectRabbitMQ(SERVICE_NAME);

    // Consumer: task.assigned
    const queue = 'bot-simulator.task-assigned';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'warepick.events', EVENTS.TASK_ASSIGNED);
    channel.prefetch(5); // Allow multiple bots to pick simultaneously

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handleTaskAssigned(data, channel);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error processing ${EVENTS.TASK_ASSIGNED}:`, err.message);
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
