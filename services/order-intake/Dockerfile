FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/order-intake/package*.json ./services/order-intake/
WORKDIR /app/services/order-intake
RUN npm ci --only=production
COPY services/order-intake/src/ ./src/
EXPOSE 3001
CMD ["node", "src/index.js"]
