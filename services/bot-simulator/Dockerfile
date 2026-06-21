FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/bot-simulator/package*.json ./services/bot-simulator/
WORKDIR /app/services/bot-simulator
RUN npm ci --only=production
COPY services/bot-simulator/src/ ./src/
EXPOSE 3004
CMD ["node", "src/index.js"]
