FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/analytics-dashboard/package*.json ./services/analytics-dashboard/
WORKDIR /app/services/analytics-dashboard
RUN npm ci --omit=dev
ENV NODE_PATH=/app/services/analytics-dashboard/node_modules
COPY services/analytics-dashboard/src/ ./src/
EXPOSE 3007
CMD ["node", "src/index.js"]
