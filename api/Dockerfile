# Use official Node.js runtime
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

WORKDIR /app

# Copy built application and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R apiuser:nodejs /app/data
RUN mkdir -p /app/db && chown -R apiuser:nodejs /app/db

# Set proper permissions
RUN chown -R apiuser:nodejs /app
USER apiuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application (skip rebuild since we already built in the build stage)
CMD ["node", "dist/index.js"]