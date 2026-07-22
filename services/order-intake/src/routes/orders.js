/**
 * Order Intake Service — Routes
 */

const express = require('express');
const router = express.Router();
const { createServiceClient } = require('../../../../shared/supabaseClient');
const { connectRabbitMQ, publish } = require('../../../../shared/rabbitmq');
const EVENTS = require('../../../../shared/events');
const STATUSES = require('../../../../shared/statuses');
const { SERVICE_NAME, DEMO_CUSTOMERS, DEMO_DESTINATIONS, DEMO_SKUS } = require('../config');

const supabase = createServiceClient();
let rabbitChannel = null;

// Initialize RabbitMQ channel
(async () => {
  try {
    const { channel } = await connectRabbitMQ(SERVICE_NAME);
    rabbitChannel = channel;
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] Failed to init RabbitMQ for routes:`, err.message);
  }
})();

// ============================================
// Helpers
// ============================================

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDemoOrder() {
  const numItems = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...DEMO_SKUS].sort(() => 0.5 - Math.random());
  const items = shuffled.slice(0, numItems).map((s) => ({
    sku: s.sku,
    productName: s.productName,
    quantity: Math.floor(Math.random() * 4) + 1,
  }));

  return {
    customerName: pick(DEMO_CUSTOMERS),
    destination: pick(DEMO_DESTINATIONS),
    priority: Math.random() > 0.8 ? 'high' : 'normal',
    items,
  };
}

async function createOrder(orderData) {
  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: orderData.customerName,
      destination: orderData.destination,
      priority: orderData.priority || 'normal',
      status: STATUSES.CREATED,
    })
    .select()
    .single();

  if (orderError) throw new Error(`Order insert failed: ${orderError.message}`);

  // Insert order items
  const items = orderData.items.map((item) => ({
    order_id: order.id,
    sku: item.sku,
    product_name: item.productName || item.product_name || item.sku,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(items);
  if (itemsError) throw new Error(`Order items insert failed: ${itemsError.message}`);

  // Publish order.created event
  if (rabbitChannel) {
    publish(rabbitChannel, EVENTS.ORDER_CREATED, {
      eventName: EVENTS.ORDER_CREATED,
      orderId: order.id,
      customerName: order.customer_name,
      destination: order.destination,
      priority: order.priority,
      items: orderData.items,
      createdAt: order.created_at,
    });
    console.log(`📦 [${SERVICE_NAME}] Published order.created for ${order.id}`);
  }

  return { ...order, items };
}

// ============================================
// Routes
// ============================================

/**
 * POST /orders — Create a new order
 */
router.post('/', async (req, res) => {
  try {
    const { customerName, destination, priority, items } = req.body;

    // Validation
    if (!customerName || typeof customerName !== 'string') {
      return res.status(400).json({ error: 'customerName is required (string)' });
    }
    if (!destination || typeof destination !== 'string') {
      return res.status(400).json({ error: 'destination is required (string)' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items is required (non-empty array)' });
    }
    for (const item of items) {
      if (!item.sku || typeof item.sku !== 'string') {
        return res.status(400).json({ error: 'Each item must have a sku (string)' });
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ error: 'Each item must have a quantity (positive integer)' });
      }
    }

    const order = await createOrder({ customerName, destination, priority, items });
    res.status(201).json(order);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] POST /orders error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /orders — List all orders
 */
router.get('/', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] GET /orders error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /orders/:id — Get order by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] GET /orders/:id error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /orders/:id/status — Update order status (internal)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] PATCH status error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /orders/demo — Generate 1 random demo order
 */
router.post('/demo', async (req, res) => {
  try {
    const order = await createOrder(generateDemoOrder());
    res.status(201).json(order);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] POST /orders/demo error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /orders/demo/batch — Generate 10 random demo orders
 */
router.post('/demo/batch', async (req, res) => {
  try {
    const count = parseInt(req.body.count) || 10;
    const orders = [];
    for (let i = 0; i < count; i++) {
      const order = await createOrder(generateDemoOrder());
      orders.push(order);
      // Stagger slightly to avoid overwhelming the pipeline
      if (i < count - 1) await new Promise((r) => setTimeout(r, 150));
    }
    res.status(201).json({ created: orders.length, orders });
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] POST /orders/demo/batch error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /orders/reset — Full demo reset
 */
router.post('/reset', async (req, res) => {
  try {
    // Delete in FK order
    await supabase.from('event_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('shipments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('packages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Reset bots to idle at dock
    const botDefaults = [
      { bot_code: 'BOT-01', status: 'idle', x_position: 2, y_position: 1, current_task_id: null },
      { bot_code: 'BOT-02', status: 'idle', x_position: 5, y_position: 1, current_task_id: null },
      { bot_code: 'BOT-03', status: 'idle', x_position: 8, y_position: 1, current_task_id: null },
      { bot_code: 'BOT-04', status: 'idle', x_position: 11, y_position: 1, current_task_id: null },
      { bot_code: 'BOT-05', status: 'idle', x_position: 14, y_position: 1, current_task_id: null },
    ];
    for (const bot of botDefaults) {
      await supabase.from('bots').update(bot).eq('bot_code', bot.bot_code);
    }

    // Reset inventory to seed quantities
    const inventoryDefaults = [
      { sku: 'SKU-1001', available_quantity: 40, reserved_quantity: 0 },
      { sku: 'SKU-1002', available_quantity: 80, reserved_quantity: 0 },
      { sku: 'SKU-1003', available_quantity: 35, reserved_quantity: 0 },
      { sku: 'SKU-1004', available_quantity: 25, reserved_quantity: 0 },
      { sku: 'SKU-1005', available_quantity: 30, reserved_quantity: 0 },
      { sku: 'SKU-1006', available_quantity: 50, reserved_quantity: 0 },
    ];
    for (const inv of inventoryDefaults) {
      await supabase.from('inventory').update(inv).eq('sku', inv.sku);
    }

    console.log(`🔄 [${SERVICE_NAME}] Demo reset complete`);
    res.json({ message: 'Demo reset complete' });
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] POST /orders/reset error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /orders/:id/reattempt — Reattempt a failed order
 */
router.post('/:id/reattempt', async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // 1. Fetch the order and items
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single();
      
    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Update status back to created
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: STATUSES.CREATED, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // 3. Re-publish the created event to trigger downstream services
    if (rabbitChannel) {
      publish(rabbitChannel, EVENTS.ORDER_CREATED, {
        eventName: EVENTS.ORDER_CREATED,
        orderId: order.id,
        customerName: order.customer_name,
        destination: order.destination,
        priority: order.priority,
        items: order.items,
        createdAt: order.created_at,
      });
      console.log(`📦 [${SERVICE_NAME}] Re-published order.created for ${order.id}`);
    }

    res.json({ message: 'Order reattempted', orderId: order.id });
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] POST /orders/:id/reattempt error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
