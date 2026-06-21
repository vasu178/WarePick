/**
 * Task Assignment Service - Configuration
 */

module.exports = {
  SERVICE_NAME: 'task-assignment-service',
  PORT: parseInt(process.env.PORT, 10) || 3003,
};
