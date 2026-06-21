FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/inventory-check/package*.json ./services/inventory-check/
WORKDIR /app/services/inventory-check
RUN npm ci --only=production
COPY services/inventory-check/src/ ./src/
EXPOSE 3002
CMD ["node", "src/index.js"]
