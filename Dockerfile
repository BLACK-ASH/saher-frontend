# --------- 1. Base ---------
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

# --------- 2. Dependencies ---------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts=false

# --------- 3. Build ---------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

RUN pnpm build

# --------- 4. Production ---------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable
RUN apk add --no-cache libc6-compat curl

# Only copy what's needed
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install prod deps (scripts allowed)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts=false

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
CMD ["pnpm", "start"]
