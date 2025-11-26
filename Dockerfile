# Multi-stage build for Mobile Tech CRM

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build backend and serve
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
WORKDIR /app/backend
RUN npm ci --production

# Copy backend code
COPY backend/ .

# Copy built frontend to serve from backend
COPY --from=frontend-builder /app/dist /app/backend/public

# Expose port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start backend server (which will also serve the frontend)
CMD ["node", "server.js"]
