FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/packing-label/package*.json ./services/packing-label/
WORKDIR /app/services/packing-label
RUN npm ci --omit=dev
ENV NODE_PATH=/app/services/packing-label/node_modules
COPY services/packing-label/src/ ./src/
EXPOSE 3005
CMD ["node", "src/index.js"]
