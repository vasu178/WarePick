/**
 * Inventory Check Service — RabbitMQ Consumer: order.created
 *
 * Checks stock availability for each SKU in the order.
 * Reserves inventory if all items available, otherwise fails the order.
 */

const { createServiceClient } = require('../../../shared/supabaseClient');
const { publish } = require('../../../shared/rabbitmq');
const EVENTS = require('../../../shared/events');
const STATUSES = require('../../../shared/statuses');
const { SERVICE_NAME } = require('../config');

const supabase = createServiceClient();

/**
 * Handle order.created event
 * @param {object} data - Event payload { orderId, items: [{sku, quantity}] }
 * @param {object} channel - RabbitMQ channel for publishing
 */
async function handleOrderCreated(data, channel) {
  const { orderId, items } = data;
  console.log(`📋 [${SERVICE_NAME}] Checking inventory for order ${orderId}`);

  // Update order status to checking_inventory
  await supabase
    .from('orders')
    .update({ status: STATUSES.CHECKING_INVENTORY })
    .eq('id', orderId);

  const failedItems = [];
  const reservedItems = [];

  // Check each item
  for (const item of items) {
    const { data: inv, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', item.sku)
      .single();

    if (error || !inv) {
      failedItems.push({ sku: item.sku, requested: item.quantity, available: 0, reason: 'SKU not found' });
      continue;
    }

    if (inv.available_quantity < item.quantity) {
      failedItems.push({
        sku: item.sku,
        requested: item.quantity,
        available: inv.available_quantity,
        reason: 'Insufficient stock',
      });
    } else {
      reservedItems.push({
        sku: item.sku,
        quantity: item.quantity,
        shelfCode: inv.shelf_code,
        productName: inv.product_name,
      });
    }
  }

  // If any items failed, fail the entire order
  if (failedItems.length > 0) {
    await supabase
      .from('orders')
      .update({ status: STATUSES.INVENTORY_FAILED })
      .eq('id', orderId);

    publish(channel, EVENTS.INVENTORY_FAILED, {
      eventName: EVENTS.INVENTORY_FAILED,
      orderId,
      reason: 'One or more items unavailable',
      failedItems,
      createdAt: new Date().toISOString(),
    });

    console.log(`❌ [${SERVICE_NAME}] Inventory check FAILED for order ${orderId}: ${failedItems.map(i => i.sku).join(', ')}`);
    return;
  }

  // All items available — reserve inventory
  for (const item of reservedItems) {
    const { error } = await supabase
      .from('inventory')
      .update({
        available_quantity: supabase.rpc ? undefined : undefined, // handled below
      })
      .eq('sku', item.sku);

    // Use raw update with arithmetic
    await supabase.rpc('reserve_inventory', {
      p_sku: item.sku,
      p_quantity: item.quantity,
    });
  }

  // Update order status
  await supabase
    .from('orders')
    .update({ status: STATUSES.INVENTORY_RESERVED })
    .eq('id', orderId);

  // Publish success event
  publish(channel, EVENTS.INVENTORY_RESERVED, {
    eventName: EVENTS.INVENTORY_RESERVED,
    orderId,
    items: reservedItems,
    createdAt: new Date().toISOString(),
  });

  console.log(`✅ [${SERVICE_NAME}] Inventory RESERVED for order ${orderId}: ${reservedItems.map(i => i.sku).join(', ')}`);
}

module.exports = { handleOrderCreated };
