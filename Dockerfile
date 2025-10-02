# Frontend Dockerfile
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY ./frontend/package*.json ./
COPY ./shared ./shared

# Build shared module first
WORKDIR /app/shared
RUN npm ci && npm run build

# Go back to app directory and install dependencies
WORKDIR /app
RUN sed -i 's|"file:../shared"|"file:./shared"|g' package.json && npm install

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/dist ./shared-dist
COPY --from=deps /app/shared/package.json ./shared-package.json
COPY ./frontend ./frontend
COPY ./shared ./shared

# Copy built shared module to node_modules
RUN rm -rf /app/node_modules/@flowauth/shared
RUN mkdir -p /app/node_modules/@flowauth/shared
RUN cp -r /app/shared-dist/* /app/node_modules/@flowauth/shared/
RUN cp /app/shared-package.json /app/node_modules/@flowauth/shared/package.json

# Fix paths in shared module package.json
RUN sed -i 's|"dist/index.js"|"index.js"|g; s|"dist/index.d.ts"|"index.d.ts"|g; s|"./dist/|"./|g' /app/node_modules/@flowauth/shared/package.json

# Go to frontend directory and reinstall to ensure shared module is properly linked
WORKDIR /app/frontend
RUN npm install

# Build the application
RUN npm run build

# Production image
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