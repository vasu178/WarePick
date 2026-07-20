FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/order-intake/package*.json ./services/order-intake/
WORKDIR /app/services/order-intake
RUN npm ci --omit=dev
ENV NODE_PATH=/app/services/order-intake/node_modules
COPY services/order-intake/src/ ./src/
EXPOSE 3001
CMD ["node", "src/index.js"]
