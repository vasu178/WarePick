/**
 * Shipping Notification Service — Entry Point
 */

const express = require('express');
const cors = require('cors');
const { createServiceClient } = require('../../shared/supabaseClient');
const { connectRabbitMQ, publish } = require('../../shared/rabbitmq');
const EVENTS = require('../../shared/events');
const STATUSES = require('../../shared/statuses');

const SERVICE_NAME = 'shipping-notification';
const PORT = process.env.PORT || 3006;
const supabase = createServiceClient();

const CARRIERS = ['WarePick Express', 'SwiftShip', 'QuickFreight', 'ReliablePost'];

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, uptime: process.uptime() });
});

// GET /shipments
app.get('/shipments', async (req, res) => {
  try {
    const { data, error } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /shipments/:id
app.get('/shipments/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('shipments').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Generate mock tracking ID
 */
function generateTrackingId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `WPK-${date}-${seq}`;
}

/**
 * Start RabbitMQ consumer for package.created
 */
async function startConsumers() {
  try {
    const { channel } = await connectRabbitMQ(SERVICE_NAME);

    const queue = 'shipping-notification.package-created';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'warepick.events', EVENTS.PACKAGE_CREATED);
    channel.prefetch(1);

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        const { packageId, orderId, labelId } = data;

        console.log(`🚚 [${SERVICE_NAME}] Creating shipment for order ${orderId}`);

        const trackingId = generateTrackingId();
        const carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];

        // Create shipment record
        const { data: shipment, error } = await supabase
          .from('shipments')
          .insert({
            order_id: orderId,
            package_id: packageId,
            carrier,
            tracking_id: trackingId,
            notification_status: 'sent',
          })
          .select()
          .single();

        if (error) throw error;

        // Update order status to shipped
        await supabase.from('orders').update({ status: STATUSES.SHIPPED }).eq('id', orderId);

        // Publish shipment.created
        publish(channel, EVENTS.SHIPMENT_CREATED, {
          eventName: EVENTS.SHIPMENT_CREATED,
          shipmentId: shipment.id,
          orderId,
          packageId,
          carrier,
          trackingId,
          createdAt: new Date().toISOString(),
        });

        console.log(`✅ [${SERVICE_NAME}] Shipment created: ${trackingId} via ${carrier}`);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error processing package.created:`, err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log(`📥 [${SERVICE_NAME}] Consuming queue: ${queue}`);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] Failed to start consumers:`, err.message);
    setTimeout(startConsumers, 5000);
  }
}

app.listen(PORT, () => {
  console.log(`✅ [${SERVICE_NAME}] Running on port ${PORT}`);
  startConsumers();
});
