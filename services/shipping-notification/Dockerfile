FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/shipping-notification/package*.json ./services/shipping-notification/
WORKDIR /app/services/shipping-notification
RUN npm ci --only=production
COPY services/shipping-notification/src/ ./src/
EXPOSE 3006
CMD ["node", "src/index.js"]
