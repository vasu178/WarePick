module.exports = {
  SERVICE_NAME: 'order-intake',
  PORT: process.env.PORT || 3001,
  DEMO_CUSTOMERS: [
    'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince',
    'Edward Norton', 'Fiona Apple', 'George Lucas', 'Hannah Montana',
  ],
  DEMO_DESTINATIONS: [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai',
    'Hyderabad', 'Kolkata', 'Pune', 'Jaipur',
  ],
  DEMO_SKUS: [
    { sku: 'SKU-1001', productName: 'Wireless Mouse' },
    { sku: 'SKU-1002', productName: 'USB-C Cable' },
    { sku: 'SKU-1003', productName: 'Keyboard' },
    { sku: 'SKU-1004', productName: 'Laptop Stand' },
    { sku: 'SKU-1005', productName: 'Headphones' },
    { sku: 'SKU-1006', productName: 'Power Bank' },
  ],
};
