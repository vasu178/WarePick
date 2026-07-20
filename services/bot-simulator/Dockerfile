FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/bot-simulator/package*.json ./services/bot-simulator/
WORKDIR /app/services/bot-simulator
RUN npm ci --omit=dev
ENV NODE_PATH=/app/services/bot-simulator/node_modules
COPY services/bot-simulator/src/ ./src/
EXPOSE 3004
CMD ["node", "src/index.js"]
