/**
 * Inventory Check Service — Routes
 */

const express = require('express');
const router = express.Router();
const { createServiceClient } = require('../../../shared/supabaseClient');
const { SERVICE_NAME, SEED_INVENTORY } = require('../config');

const supabase = createServiceClient();

/**
 * GET /inventory — List all SKUs
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('sku');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] GET /inventory error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /inventory/:sku — Get single SKU
 */
router.get('/:sku', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', req.params.sku)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'SKU not found' });
    res.json(data);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] GET /inventory/:sku error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /inventory/:sku — Update stock quantity
 */
router.patch('/:sku', async (req, res) => {
  try {
    const { available_quantity, reserved_quantity } = req.body;
    const update = {};
    if (available_quantity !== undefined) update.available_quantity = available_quantity;
    if (reserved_quantity !== undefined) update.reserved_quantity = reserved_quantity;

    const { data, error } = await supabase
      .from('inventory')
      .update(update)
      .eq('sku', req.params.sku)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] PATCH /inventory/:sku error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /inventory/reset — Reset to seed quantities
 */
router.post('/reset', async (req, res) => {
  try {
    for (const item of SEED_INVENTORY) {
      await supabase
        .from('inventory')
        .update({ available_quantity: item.available_quantity, reserved_quantity: 0 })
        .eq('sku', item.sku);
    }
    console.log(`🔄 [${SERVICE_NAME}] Inventory reset to seed quantities`);
    res.json({ message: 'Inventory reset complete' });
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] POST /inventory/reset error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
