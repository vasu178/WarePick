/**
 * Task Assignment Service - Task Routes
 */

const express = require('express');
const router = express.Router();
const { createServiceClient } = require('../../../../shared/supabaseClient');
const { SERVICE_NAME } = require('../config');

const supabase = createServiceClient();

/**
 * GET /tasks - List all tasks
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log(`❌ [${SERVICE_NAME}] Failed to fetch tasks:`, error.message);
      return res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
    }

    res.json({ tasks: data });
  } catch (err) {
    console.log(`❌ [${SERVICE_NAME}] Error in GET /tasks:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /tasks/:id - Get task details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.log(`❌ [${SERVICE_NAME}] Failed to fetch task ${id}:`, error.message);
      return res.status(404).json({ error: 'Task not found', details: error.message });
    }

    res.json({ task: data });
  } catch (err) {
    console.log(`❌ [${SERVICE_NAME}] Error in GET /tasks/:id:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
