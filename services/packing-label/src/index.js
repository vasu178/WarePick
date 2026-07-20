/**
 * Packing & Label Service — Entry Point
 */

const express = require('express');
const cors = require('cors');
const { createServiceClient } = require('../../../shared/supabaseClient');
const { connectRabbitMQ, publish } = require('../../../shared/rabbitmq');
const EVENTS = require('../../../shared/events');
const STATUSES = require('../../../shared/statuses');

const SERVICE_NAME = 'packing-label';
const PORT = process.env.PORT || 3005;
const supabase = createServiceClient();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, uptime: process.uptime() });
});

// GET /packages
app.get('/packages', async (req, res) => {
  try {
    const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /packages/:id
app.get('/packages/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('packages').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /packages/:id/label
app.get('/packages/:id/label', async (req, res) => {
  try {
    const { data: pkg, error } = await supabase.from('packages').select('*').eq('id', req.params.id).single();
    if (error) throw error;

    const { data: order } = await supabase.from('orders').select('*, order_items(*)').eq('id', pkg.order_id).single();

    res.json({
      labelId: pkg.label_id,
      packageId: pkg.id,
      orderId: pkg.order_id,
      customerName: order?.customer_name,
      destination: order?.destination,
      items: order?.order_items || [],
      createdAt: pkg.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Generate mock label ID
 */
function generateLabelId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `LBL-${date}-${seq}`;
}

/**
 * Start RabbitMQ consumer for bot.pick_completed
 */
async function startConsumers() {
  try {
    const { channel } = await connectRabbitMQ(SERVICE_NAME);

    const queue = 'packing-label.bot-pick-completed';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'warepick.events', EVENTS.BOT_PICK_COMPLETED);
    channel.prefetch(1);

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        const { orderId, taskId, botCode } = data;

        console.log(`📦 [${SERVICE_NAME}] Creating package for order ${orderId}`);

        const labelId = generateLabelId();

        // Create package record
        const { data: pkg, error } = await supabase
          .from('packages')
          .insert({
            order_id: orderId,
            label_id: labelId,
            status: 'ready_for_shipping',
          })
          .select()
          .single();

        if (error) throw error;

        // Update order status to packed
        await supabase.from('orders').update({ status: STATUSES.PACKED }).eq('id', orderId);

        // Publish package.created event
        publish(channel, EVENTS.PACKAGE_CREATED, {
          eventName: EVENTS.PACKAGE_CREATED,
          packageId: pkg.id,
          orderId,
          labelId,
          createdAt: new Date().toISOString(),
        });

        console.log(`✅ [${SERVICE_NAME}] Package ${pkg.id} created with label ${labelId}`);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error processing pick_completed:`, err.message);
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
