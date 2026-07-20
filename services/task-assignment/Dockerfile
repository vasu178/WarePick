FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY services/task-assignment/package*.json ./services/task-assignment/
WORKDIR /app/services/task-assignment
RUN npm ci --omit=dev
ENV NODE_PATH=/app/services/task-assignment/node_modules
COPY services/task-assignment/src/ ./src/
EXPOSE 3003
CMD ["node", "src/index.js"]
