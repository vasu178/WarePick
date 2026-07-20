/**
 * Bot Simulator — Routes
 */

const express = require('express');
const router = express.Router();
const { createServiceClient } = require('../../../../shared/supabaseClient');
const { SERVICE_NAME, DOCK_POSITIONS } = require('../config');

const supabase = createServiceClient();

/**
 * GET /bots — List all bots
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .order('bot_code');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] GET /bots error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /bots/:id — Get bot state
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Bot not found' });
    res.json(data);
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] GET /bots/:id error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /bots/reset — Reset all bots to dock
 */
router.post('/reset', async (req, res) => {
  try {
    const { data: bots } = await supabase.from('bots').select('bot_code').order('bot_code');

    for (let i = 0; i < bots.length; i++) {
      const dockPos = DOCK_POSITIONS[i] || DOCK_POSITIONS[0];
      await supabase
        .from('bots')
        .update({
          status: 'idle',
          x_position: dockPos.x,
          y_position: dockPos.y,
          current_task_id: null,
        })
        .eq('bot_code', bots[i].bot_code);
    }

    console.log(`🔄 [${SERVICE_NAME}] All bots reset to dock`);
    res.json({ message: 'Bots reset to dock positions' });
  } catch (err) {
    console.error(`❌ [${SERVICE_NAME}] POST /bots/reset error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
