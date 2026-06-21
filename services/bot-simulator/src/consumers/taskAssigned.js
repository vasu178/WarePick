/**
 * Bot Simulator — Consumer: task.assigned
 */

const { createServiceClient } = require('../../../shared/supabaseClient');
const { simulatePicking } = require('../simulation/movement');
const SERVICE_NAME = 'bot-simulator';

const supabase = createServiceClient();

/**
 * Handle task.assigned event
 * Fetches the bot from DB and starts the picking simulation.
 */
async function handleTaskAssigned(data, channel) {
  const { taskId, orderId, botId, botCode, sourceShelves } = data;

  console.log(`🎯 [${SERVICE_NAME}] Task ${taskId} assigned to ${botCode}, shelves: ${sourceShelves.join(', ')}`);

  // Fetch current bot state from DB
  const { data: bot, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', botId)
    .single();

  if (error || !bot) {
    console.error(`❌ [${SERVICE_NAME}] Bot ${botId} not found:`, error?.message);
    return;
  }

  // Start picking simulation (runs asynchronously)
  simulatePicking(bot, sourceShelves, taskId, channel).catch((err) => {
    console.error(`❌ [${SERVICE_NAME}] Picking simulation failed for ${botCode}:`, err.message);
  });
}

module.exports = { handleTaskAssigned };
