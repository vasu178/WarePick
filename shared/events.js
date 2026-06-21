/**
 * WarePick Event Names
 * Used as RabbitMQ routing keys on the 'warepick.events' topic exchange.
 * All services import from this file to ensure consistency.
 */

module.exports = {
  // Order Intake Service
  ORDER_CREATED: 'order.created',

  // Inventory Check Service
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_FAILED: 'inventory.failed',

  // Task Assignment Service
  TASK_ASSIGNED: 'task.assigned',
  TASK_QUEUED: 'task.queued',

  // Bot Simulator Service
  BOT_POSITION_UPDATED: 'bot.position_updated',
  BOT_PICK_COMPLETED: 'bot.pick_completed',
  BOT_AVAILABLE: 'bot.available',

  // Packing & Label Service
  PACKAGE_CREATED: 'package.created',

  // Shipping Notification Service
  SHIPMENT_CREATED: 'shipment.created',
};
