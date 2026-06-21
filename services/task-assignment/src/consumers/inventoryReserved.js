/**
 * Task Assignment Service - inventory.reserved Consumer
 *
 * When inventory is reserved for an order, create a picking task
 * and assign it to an idle bot (or queue it if none available).
 */

const { createServiceClient } = require('../../../shared/supabaseClient');
const { publish } = require('../../../shared/rabbitmq');
const EVENTS = require('../../../shared/events');
const STATUSES = require('../../../shared/statuses');
const { SERVICE_NAME } = require('../config');

const supabase = createServiceClient();

/**
 * Handle the inventory.reserved event
 * @param {object} msg - Parsed message payload
 * @param {object} channel - RabbitMQ channel for publishing
 */
async function handleInventoryReserved(msg, channel) {
  const { orderId, items } = msg;

  console.log(`📦 [${SERVICE_NAME}] Inventory reserved for order ${orderId} — creating task...`);

  // Extract shelf codes from items
  const sourceShelves = items.map((item) => item.shelfCode);

  // Find an idle bot
  const { data: idleBot, error: botError } = await supabase
    .from('bots')
    .select('*')
    .eq('status', 'idle')
    .order('bot_code', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (botError) {
    console.error(`❌ [${SERVICE_NAME}] Error querying bots:`, botError.message);
  }

  if (idleBot) {
    // ========== IDLE BOT FOUND — assign immediately ==========
    console.log(`🤖 [${SERVICE_NAME}] Found idle bot ${idleBot.bot_code} — assigning task`);

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        order_id: orderId,
        bot_id: idleBot.id,
        status: 'assigned',
        source_shelves: sourceShelves,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (taskError) {
      console.error(`❌ [${SERVICE_NAME}] Failed to create task:`, taskError.message);
      return;
    }

    // Update bot status
    await supabase
      .from('bots')
      .update({ status: 'assigned', current_task_id: task.id })
      .eq('id', idleBot.id);

    // Update order status
    await supabase
      .from('orders')
      .update({ status: STATUSES.TASK_ASSIGNED })
      .eq('id', orderId);

    // Publish task.assigned
    publish(channel, EVENTS.TASK_ASSIGNED, {
      eventName: EVENTS.TASK_ASSIGNED,
      taskId: task.id,
      orderId,
      botId: idleBot.id,
      botCode: idleBot.bot_code,
      sourceShelves,
      destinationZone: 'PACKING',
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ [${SERVICE_NAME}] Task ${task.id} assigned to ${idleBot.bot_code}`);
  } else {
    // ========== NO IDLE BOT — queue the task ==========
    console.log(`⏳ [${SERVICE_NAME}] No idle bot — queuing task for order ${orderId}`);

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        order_id: orderId,
        bot_id: null,
        status: 'queued',
        source_shelves: sourceShelves,
      })
      .select()
      .single();

    if (taskError) {
      console.error(`❌ [${SERVICE_NAME}] Failed to create queued task:`, taskError.message);
      return;
    }

    // Update order status
    await supabase
      .from('orders')
      .update({ status: STATUSES.WAITING_FOR_BOT })
      .eq('id', orderId);

    // Publish task.queued
    publish(channel, EVENTS.TASK_QUEUED, {
      eventName: EVENTS.TASK_QUEUED,
      taskId: task.id,
      orderId,
      reason: 'No idle bot available',
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ [${SERVICE_NAME}] Task ${task.id} queued`);
  }
}

module.exports = { handleInventoryReserved };
