/**
 * Order Intake Service — Entry Point
 */

const express = require('express');
const cors = require('cors');
const { SERVICE_NAME, PORT } = require('./config');
const orderRoutes = require('./routes/orders');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, uptime: process.uptime() });
});

// Routes
app.use('/orders', orderRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ [${SERVICE_NAME}] Running on port ${PORT}`);
});
