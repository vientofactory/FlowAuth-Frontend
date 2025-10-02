# Frontend Dockerfile
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY ./frontend/package*.json ./
COPY ./shared ./shared
RUN sed -i 's|"file:../shared"|"file:./shared"|g' package.json && npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./frontend ./frontend
COPY ./shared ./shared

# Build shared module first
WORKDIR /app/shared
RUN npm ci && npm run build

# Copy built shared module to node_modules
RUN rm -rf /app/node_modules/@flowauth/shared
RUN mkdir -p /app/node_modules/@flowauth/shared
RUN cp -r /app/shared/dist/* /app/node_modules/@flowauth/shared/

# Go back to frontend directory
WORKDIR /app/frontend

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sveltekit

# Copy the built application
COPY --from=builder /app/frontend/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/.env ./.env

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Change ownership of the app directory
RUN chown -R sveltekit:nodejs /app
USER sveltekit

EXPOSE 3000

ENV PORT 3000

# Start the server
CMD ["node", "build/index.js"]