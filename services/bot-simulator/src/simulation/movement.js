/**
 * Bot Movement Simulation
 *
 * Moves a bot step-by-step through the warehouse grid:
 *   Dock → Shelf(s) → Packing Zone → Dock
 *
 * Uses Supabase Broadcast for real-time position streaming
 * and updates the database only for state changes.
 */

const { createServiceClient } = require('../../../../shared/supabaseClient');
const { MOVE_INTERVAL_MS, SHELF_POSITIONS, PACKING_POSITION, DOCK_POSITIONS } = require('../config');
const SERVICE_NAME = 'bot-simulator';

const supabase = createServiceClient();

function calculatePath(fromX, fromY, toX, toY) {
  const steps = [];
  let cx = fromX, cy = fromY;

  // If already in the correct vertical aisle, just move vertically
  if (cx === toX) {
    while (cy !== toY) {
      cy += cy < toY ? 1 : -1;
      steps.push({ x: cx, y: cy });
    }
    return steps;
  }

  // We need to change aisles, so move via a horizontal highway to avoid shelves.
  // Highways are y = 1 (dock) and y = 14 (above packing station)
  const distToTop = Math.abs(cy - 1) + Math.abs(toY - 1);
  const distToBottom = Math.abs(cy - 14) + Math.abs(toY - 14);
  const highwayY = distToTop < distToBottom ? 1 : 14;

  // Step 1: Move vertically to highway
  while (cy !== highwayY) {
    cy += cy < highwayY ? 1 : -1;
    steps.push({ x: cx, y: cy });
  }

  // Step 2: Move horizontally along highway to destination aisle
  while (cx !== toX) {
    cx += cx < toX ? 1 : -1;
    steps.push({ x: cx, y: cy });
  }

  // Step 3: Move vertically down the aisle to destination
  while (cy !== toY) {
    cy += cy < toY ? 1 : -1;
    steps.push({ x: cx, y: cy });
  }

  return steps;
}

/**
 * Move a bot along a path, broadcasting position at each step.
 */
async function moveAlongPath(bot, path, status, broadcastChannel) {
  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    await new Promise((resolve) => setTimeout(resolve, MOVE_INTERVAL_MS));

    // Broadcast ephemeral position update (no DB write per step)
    broadcastChannel.send({
      type: 'broadcast',
      event: 'bot.position_updated',
      payload: {
        botId: bot.id,
        botCode: bot.bot_code,
        x: step.x,
        y: step.y,
        status,
        taskId: bot.current_task_id,
        timestamp: Date.now(),
        path: path.slice(i),
      },
    });
  }

  // Persist final position to DB
  const finalPos = path[path.length - 1] || { x: bot.x_position, y: bot.y_position };
  await supabase
    .from('bots')
    .update({
      x_position: finalPos.x,
      y_position: finalPos.y,
      status,
    })
    .eq('id', bot.id);

  return finalPos;
}

/**
 * Run the full picking simulation for a bot:
 * 1. Move from current position to each shelf
 * 2. Move from last shelf to packing zone
 * 3. Move from packing zone back to dock
 *
 * @param {object} bot - Bot record from DB
 * @param {string[]} shelfCodes - Array of shelf codes to visit
 * @param {string} taskId - Task ID
 * @param {object} channel - RabbitMQ channel for publishing
 */
async function simulatePicking(bot, shelfCodes, taskId, channel) {
  const { publish } = require('../../../../shared/rabbitmq');
  const EVENTS = require('../../../../shared/events');
  const STATUSES = require('../../../../shared/statuses');

  // Create Supabase Broadcast channel
  const broadcastChannel = supabase.channel('warehouse-floor');
  await broadcastChannel.subscribe();

  let currentX = bot.x_position;
  let currentY = bot.y_position;

  console.log(`🤖 [${SERVICE_NAME}] ${bot.bot_code} starting pick: shelves=${shelfCodes.join(',')}`);

  // Update bot status to picking
  await supabase
    .from('bots')
    .update({ status: 'picking', current_task_id: taskId })
    .eq('id', bot.id);

  // Update task status to picking
  await supabase
    .from('tasks')
    .update({ status: 'picking' })
    .eq('id', taskId);

  // Update order status to picking
  const { data: task } = await supabase
    .from('tasks')
    .select('order_id')
    .eq('id', taskId)
    .single();

  if (task) {
    await supabase
      .from('orders')
      .update({ status: STATUSES.PICKING })
      .eq('id', task.order_id);
  }

  // 1. Visit each shelf
  for (const shelfCode of shelfCodes) {
    const shelfPos = SHELF_POSITIONS[shelfCode];
    if (!shelfPos) {
      console.warn(`⚠️ [${SERVICE_NAME}] Unknown shelf code: ${shelfCode}`);
      continue;
    }

    const pathToShelf = calculatePath(currentX, currentY, shelfPos.x, shelfPos.y);
    if (pathToShelf.length > 0) {
      const finalPos = await moveAlongPath(bot, pathToShelf, 'picking', broadcastChannel);
      currentX = finalPos.x;
      currentY = finalPos.y;
    }

    // Brief pause at shelf (simulating picking items)
    await new Promise((r) => setTimeout(r, 800));
  }

  // 2. Move to packing zone
  const pathToPacking = calculatePath(currentX, currentY, PACKING_POSITION.x, PACKING_POSITION.y);
  if (pathToPacking.length > 0) {
    const finalPos = await moveAlongPath(bot, pathToPacking, 'delivering_to_packing', broadcastChannel);
    currentX = finalPos.x;
    currentY = finalPos.y;
  }

  // Brief pause at packing (simulating drop-off)
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Move to shipping area
  const SHIPPING_POSITION = { x: 20, y: 15 };
  const pathToShipping = calculatePath(currentX, currentY, SHIPPING_POSITION.x, SHIPPING_POSITION.y);
  if (pathToShipping.length > 0) {
    const finalPos = await moveAlongPath(bot, pathToShipping, 'delivering_to_shipping', broadcastChannel);
    currentX = finalPos.x;
    currentY = finalPos.y;
  }

  // Brief pause at shipping (simulating dispatch)
  await new Promise((r) => setTimeout(r, 1000));

  // Update order to picked and task to completed
  await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', taskId);

  if (task) {
    await supabase.from('orders').update({ status: STATUSES.PICKED }).eq('id', task.order_id);
  }

  // Publish bot.pick_completed
  publish(channel, EVENTS.BOT_PICK_COMPLETED, {
    eventName: EVENTS.BOT_PICK_COMPLETED,
    botId: bot.id,
    botCode: bot.bot_code,
    taskId,
    orderId: task ? task.order_id : null,
    createdAt: new Date().toISOString(),
  });

  console.log(`📦 [${SERVICE_NAME}] ${bot.bot_code} pick completed for task ${taskId}`);

  // 3. Return to dock
  await supabase.from('bots').update({ status: 'returning' }).eq('id', bot.id);

  // Find original dock position for this bot
  const botIndex = parseInt(bot.bot_code.replace('BOT-0', '').replace('BOT-', '')) - 1;
  const dockPos = DOCK_POSITIONS[botIndex] || DOCK_POSITIONS[0];

  const pathToDock = calculatePath(currentX, currentY, dockPos.x, dockPos.y);
  if (pathToDock.length > 0) {
    await moveAlongPath(bot, pathToDock, 'returning', broadcastChannel);
  }

  // Bot is now idle
  await supabase
    .from('bots')
    .update({
      status: 'idle',
      current_task_id: null,
      x_position: dockPos.x,
      y_position: dockPos.y,
    })
    .eq('id', bot.id);

  // Broadcast final idle position
  broadcastChannel.send({
    type: 'broadcast',
    event: 'bot.position_updated',
    payload: {
      botId: bot.id,
      botCode: bot.bot_code,
      x: dockPos.x,
      y: dockPos.y,
      status: 'idle',
      taskId: null,
      timestamp: Date.now(),
      path: [],
    },
  });

  // Publish bot.available so Task Assignment can assign queued tasks
  publish(channel, EVENTS.BOT_AVAILABLE, {
    eventName: EVENTS.BOT_AVAILABLE,
    botId: bot.id,
    botCode: bot.bot_code,
    createdAt: new Date().toISOString(),
  });

  console.log(`✅ [${SERVICE_NAME}] ${bot.bot_code} returned to dock, now idle`);

  // Cleanup broadcast channel
  await supabase.removeChannel(broadcastChannel);
}

module.exports = { simulatePicking, calculatePath };
