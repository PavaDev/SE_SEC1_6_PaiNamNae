# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

# Generate Prisma Client
RUN npx prisma generate

# ---- Stage 2: Production image ----
FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Re-generate Prisma Client in the production image (ensures correct binary target)
RUN npx prisma generate

EXPOSE 3000

# Run migrations with reset (flushes data and runs seed) then start the server
CMD ["sh", "-c", "npx prisma migrate reset --force && node server.js"]
