/**
 * WarePick RabbitMQ Connection Helper
 * Provides connection with retry, publish, and consume utilities.
 * All services use the 'warepick.events' topic exchange.
 */

const amqp = require('amqplib');

const EXCHANGE = 'warepick.events';
const EXCHANGE_TYPE = 'topic';

/**
 * Connect to RabbitMQ with exponential backoff retry.
 * @param {string} serviceName - Name of the connecting service (for logging)
 * @param {number} maxRetries - Maximum connection attempts (default 15)
 * @param {number} baseDelay - Base delay in ms between retries (default 2000)
 * @returns {{ connection, channel }} - AMQP connection and channel
 */
async function connectRabbitMQ(serviceName = 'unknown', maxRetries = 15, baseDelay = 2000) {
  const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await amqp.connect(url);
      const channel = await connection.createChannel();

      // Assert the topic exchange
      await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });

      // Handle connection errors
      connection.on('error', (err) => {
        console.error(`❌ [${serviceName}] RabbitMQ connection error:`, err.message);
      });
      connection.on('close', () => {
        console.warn(`⚠️ [${serviceName}] RabbitMQ connection closed`);
      });

      console.log(`✅ [${serviceName}] Connected to RabbitMQ`);
      return { connection, channel };
    } catch (err) {
      const delay = baseDelay * Math.min(Math.pow(1.5, attempt - 1), 10);
      console.log(
        `⏳ [${serviceName}] RabbitMQ connection attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${Math.round(delay)}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `❌ [${serviceName}] Failed to connect to RabbitMQ after ${maxRetries} attempts`
  );
}

/**
 * Publish a message to the topic exchange.
 * @param {object} channel - AMQP channel
 * @param {string} routingKey - Event routing key (e.g., 'order.created')
 * @param {object} data - Message payload (will be JSON-serialized)
 */
function publish(channel, routingKey, data) {
  const message = Buffer.from(JSON.stringify(data));
  channel.publish(EXCHANGE, routingKey, message, {
    persistent: true,
    contentType: 'application/json',
    timestamp: Date.now(),
  });
}

/**
 * Set up a consumer on a named queue bound to a routing key.
 * @param {object} channel - AMQP channel
 * @param {string} queueName - Named queue (e.g., 'inventory-check.order-created')
 * @param {string} routingKey - Routing key to bind (e.g., 'order.created')
 * @param {function} handler - Async handler function(data, msg)
 * @param {string} serviceName - Service name for logging
 */
async function consume(channel, queueName, routingKey, handler, serviceName = 'unknown') {
  await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(queueName, EXCHANGE, routingKey);
  channel.prefetch(1);

  console.log(`📥 [${serviceName}] Listening on queue '${queueName}' for '${routingKey}'`);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data, msg);
      channel.ack(msg);
    } catch (err) {
      console.error(
        `❌ [${serviceName}] Error processing message from '${queueName}':`,
        err.message
      );
      // Reject and don't requeue to avoid infinite loops
      channel.nack(msg, false, false);
    }
  });
}

module.exports = {
  EXCHANGE,
  connectRabbitMQ,
  publish,
  consume,
};
