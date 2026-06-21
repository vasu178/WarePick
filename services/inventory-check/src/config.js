module.exports = {
  SERVICE_NAME: 'inventory-check',
  PORT: process.env.PORT || 3002,
  SEED_INVENTORY: [
    { sku: 'SKU-1001', product_name: 'Wireless Mouse', shelf_code: 'A1', available_quantity: 40, reserved_quantity: 0 },
    { sku: 'SKU-1002', product_name: 'USB-C Cable', shelf_code: 'A2', available_quantity: 80, reserved_quantity: 0 },
    { sku: 'SKU-1003', product_name: 'Keyboard', shelf_code: 'B1', available_quantity: 35, reserved_quantity: 0 },
    { sku: 'SKU-1004', product_name: 'Laptop Stand', shelf_code: 'B2', available_quantity: 25, reserved_quantity: 0 },
    { sku: 'SKU-1005', product_name: 'Headphones', shelf_code: 'C1', available_quantity: 30, reserved_quantity: 0 },
    { sku: 'SKU-1006', product_name: 'Power Bank', shelf_code: 'C2', available_quantity: 50, reserved_quantity: 0 },
  ],
};
