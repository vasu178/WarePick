/**
 * Analytics Dashboard Service — Entry Point
 *
 * Consumes ALL events via RabbitMQ wildcard (#) binding.
 * Logs events, computes metrics, and broadcasts via Supabase Broadcast.
 */

const express = require('express');
const cors = require('cors');
const { createServiceClient } = require('../../shared/supabaseClient');
const { connectRabbitMQ } = require('../../shared/rabbitmq');

const SERVICE_NAME = 'analytics-dashboard';
const PORT = process.env.PORT || 3007;
const supabase = createServiceClient();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, uptime: process.uptime() });
});

/**
 * GET /analytics/summary — Current KPI summary
 */
app.get('/analytics/summary', async (req, res) => {
  try {
    // Total orders by status
    const { data: orders } = await supabase.from('orders').select('id, status, created_at, updated_at');

    const total = orders ? orders.length : 0;
    const shipped = orders ? orders.filter((o) => o.status === 'shipped').length : 0;
    const failed = orders ? orders.filter((o) => ['inventory_failed', 'fulfillment_error'].includes(o.status)).length : 0;
    const inProgress = total - shipped - failed;

    // Average fulfillment time (for shipped orders)
    let avgFulfillmentMs = 0;
    const shippedOrders = orders ? orders.filter((o) => o.status === 'shipped') : [];
    if (shippedOrders.length > 0) {
      const totalMs = shippedOrders.reduce((sum, o) => {
        return sum + (new Date(o.updated_at) - new Date(o.created_at));
      }, 0);
      avgFulfillmentMs = totalMs / shippedOrders.length;
    }

    // Bot utilization
    const { data: bots } = await supabase.from('bots').select('id, status');
    const totalBots = bots ? bots.length : 0;
    const activeBots = bots ? bots.filter((b) => b.status !== 'idle' && b.status !== 'offline').length : 0;

    // Inventory summary
    const { data: inventory } = await supabase.from('inventory').select('sku, product_name, available_quantity, reserved_quantity');

    res.json({
      orders: { total, shipped, failed, inProgress },
      avgFulfillmentTimeSec: Math.round(avgFulfillmentMs / 1000),
      bots: { total: totalBots, active: activeBots, idle: totalBots - activeBots },
      inventory: inventory || [],
    });
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] GET /analytics/summary error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /analytics/events — Recent event stream
 */
app.get('/analytics/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { data, error } = await supabase
      .from('event_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] GET /analytics/events error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /analytics/orders — Order lifecycle metrics
 */
app.get('/analytics/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, customer_name, destination, priority, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /analytics/bots — Bot utilization stats
 */
app.get('/analytics/bots', async (req, res) => {
  try {
    const { data: bots } = await supabase.from('bots').select('*').order('bot_code');
    const { data: tasks } = await supabase.from('tasks').select('bot_id, status, assigned_at, completed_at').eq('status', 'completed');

    // Calculate tasks completed per bot
    const botStats = (bots || []).map((bot) => {
      const botTasks = (tasks || []).filter((t) => t.bot_id === bot.id);
      return {
        ...bot,
        tasksCompleted: botTasks.length,
      };
    });

    res.json(botStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Start RabbitMQ consumer — wildcard binding receives ALL events
 */
async function startConsumers() {
  try {
    const { channel } = await connectRabbitMQ(SERVICE_NAME);

    const queue = 'analytics-dashboard.all-events';
    await channel.assertQueue(queue, { durable: true });
    // Wildcard '#' matches ALL routing keys
    await channel.bindQueue(queue, 'warepick.events', '#');
    channel.prefetch(10);

    // Create Supabase Broadcast channel for system-level notifications
    const broadcastChannel = supabase.channel('system');
    await broadcastChannel.subscribe();

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const routingKey = msg.fields.routingKey;
        const data = JSON.parse(msg.content.toString());

        // Log event to event_log table
        await supabase.from('event_log').insert({
          event_name: routingKey,
          entity_type: routingKey.split('.')[0], // 'order', 'inventory', 'bot', etc.
          entity_id: data.orderId || data.botId || data.taskId || data.packageId || data.shipmentId || null,
          payload: data,
        });

        // Broadcast to frontend via Supabase Broadcast
        broadcastChannel.send({
          type: 'broadcast',
          event: 'system.event',
          payload: {
            eventName: routingKey,
            data,
            timestamp: new Date().toISOString(),
          },
        });

        console.log(`📊 [${SERVICE_NAME}] Logged event: ${routingKey}`);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ [${SERVICE_NAME}] Error processing event:`, err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log(`📥 [${SERVICE_NAME}] Consuming ALL events via wildcard '#'`);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] Failed to start consumers:`, err.message);
    setTimeout(startConsumers, 5000);
  }
}

app.listen(PORT, () => {
  console.log(`✅ [${SERVICE_NAME}] Running on port ${PORT}`);
  startConsumers();
});
