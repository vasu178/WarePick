FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/shipping-notification/package*.json ./services/shipping-notification/
WORKDIR /app/services/shipping-notification
RUN npm ci --omit=dev
ENV NODE_PATH=/app/services/shipping-notification/node_modules
COPY services/shipping-notification/src/ ./src/
EXPOSE 3006
CMD ["node", "src/index.js"]
