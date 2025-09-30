# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build
RUN npm run build

# Prune dev dependencies for runtime
RUN npm prune --omit=dev


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and production deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Expose both ports (choose per service)
EXPOSE 3000
EXPOSE 8080

# Default command runs client; service-specific command can override in compose
CMD ["node", "dist/src/main.client.js"]


