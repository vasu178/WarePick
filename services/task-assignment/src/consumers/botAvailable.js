/**
 * Task Assignment Service - bot.available Consumer
 *
 * When a bot becomes available, check for queued tasks and assign
 * the oldest one.
 */

const { createServiceClient } = require('../../../../shared/supabaseClient');
const { publish } = require('../../../../shared/rabbitmq');
const EVENTS = require('../../../../shared/events');
const STATUSES = require('../../../../shared/statuses');
const { SERVICE_NAME } = require('../config');

const supabase = createServiceClient();

/**
 * Handle the bot.available event
 * @param {object} msg - Parsed message payload { botId, botCode }
 * @param {object} channel - RabbitMQ channel for publishing
 */
async function handleBotAvailable(msg, channel) {
  const { botId, botCode } = msg;

  console.log(`🤖 [${SERVICE_NAME}] Bot ${botCode} is available — checking for queued tasks...`);

  // Find oldest queued task
  const { data: queuedTask, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'queued')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (taskError) {
    console.error(`❌ [${SERVICE_NAME}] Error querying queued tasks:`, taskError.message);
    return;
  }

  if (!queuedTask) {
    console.log(`✅ [${SERVICE_NAME}] No queued tasks — bot ${botCode} stays idle`);
    return;
  }

  console.log(`📦 [${SERVICE_NAME}] Assigning queued task ${queuedTask.id} to ${botCode}`);

  // Update task
  await supabase
    .from('tasks')
    .update({
      bot_id: botId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    })
    .eq('id', queuedTask.id);

  // Update bot
  await supabase
    .from('bots')
    .update({ status: 'assigned', current_task_id: queuedTask.id })
    .eq('id', botId);

  // Update order status
  await supabase
    .from('orders')
    .update({ status: STATUSES.TASK_ASSIGNED })
    .eq('id', queuedTask.order_id);

  // Publish task.assigned
  publish(channel, EVENTS.TASK_ASSIGNED, {
    eventName: EVENTS.TASK_ASSIGNED,
    taskId: queuedTask.id,
    orderId: queuedTask.order_id,
    botId,
    botCode,
    sourceShelves: queuedTask.source_shelves,
    destinationZone: 'PACKING',
    createdAt: new Date().toISOString(),
  });

  console.log(`✅ [${SERVICE_NAME}] Queued task ${queuedTask.id} assigned to ${botCode}`);
}

module.exports = { handleBotAvailable };
