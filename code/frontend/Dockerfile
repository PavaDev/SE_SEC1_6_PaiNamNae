# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# Copy source code
COPY . .

# Build arguments for public runtime config (baked into client bundle)
ARG NUXT_PUBLIC_API_BASE=http://localhost:3000/api/
ARG NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Set as env vars for the build process
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NUXT_PUBLIC_GOOGLE_MAPS_API_KEY

RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

WORKDIR /app

# Copy the Nuxt output directory
COPY --from=build /app/.output ./.output

EXPOSE 3001

ENV HOST=0.0.0.0
ENV PORT=3001
ENV NITRO_PORT=3001

CMD ["node", ".output/server/index.mjs"]
