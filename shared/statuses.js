/**
 * WarePick Order Lifecycle Statuses
 * Maps to the `status` column in the `orders` table.
 */

module.exports = {
  CREATED: 'created',
  CHECKING_INVENTORY: 'checking_inventory',
  INVENTORY_FAILED: 'inventory_failed',
  INVENTORY_RESERVED: 'inventory_reserved',
  WAITING_FOR_BOT: 'waiting_for_bot',
  TASK_ASSIGNED: 'task_assigned',
  PICKING: 'picking',
  PICKED: 'picked',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  FULFILLMENT_ERROR: 'fulfillment_error',
};
