# Multi-stage build for Mobile Tech CRM

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend
COPY --from=frontend-builder /app/dist ./public

# Expose port
EXPOSE 3001

# Environment
ENV NODE_ENV=production
ENV PORT=3001

# Start server
CMD ["node", "server.js"]
