module.exports = {
  SERVICE_NAME: 'bot-simulator',
  PORT: process.env.PORT || 3004,
  MOVE_INTERVAL_MS: 500,  // Time between grid steps

  // Warehouse grid positions
  DOCK_POSITIONS: [
    { x: 2, y: 1 },
    { x: 6, y: 1 },
    { x: 10, y: 1 },
    { x: 14, y: 1 },
    { x: 18, y: 1 },
  ],

  // Shelf code → grid coordinate mapping
  SHELF_POSITIONS: {
    'A1': { x: 2, y: 3 },
    'A2': { x: 2, y: 8 },
    'B1': { x: 6, y: 3 },
    'B2': { x: 6, y: 8 },
    'C1': { x: 10, y: 3 },
    'C2': { x: 10, y: 8 },
  },

  // Packing zone position (bot goes here after picking)
  PACKING_POSITION: { x: 10, y: 15 },
};
