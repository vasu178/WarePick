module.exports = {
  SERVICE_NAME: 'bot-simulator',
  PORT: process.env.PORT || 3004,
  MOVE_INTERVAL_MS: 500,  // Time between grid steps

  // Warehouse grid positions
  DOCK_POSITIONS: [
    { x: 2, y: 1 },
    { x: 5, y: 1 },
    { x: 8, y: 1 },
    { x: 11, y: 1 },
    { x: 14, y: 1 },
  ],

  // Shelf code → grid coordinate mapping
  SHELF_POSITIONS: {
    'A1': { x: 3, y: 4 },
    'A2': { x: 8, y: 4 },
    'B1': { x: 3, y: 7 },
    'B2': { x: 8, y: 7 },
    'C1': { x: 3, y: 10 },
    'C2': { x: 8, y: 10 },
  },

  // Packing zone position (bot goes here after picking)
  PACKING_POSITION: { x: 15, y: 13 },
};
