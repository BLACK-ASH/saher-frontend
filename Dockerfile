# --------- 1. Base ---------

FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

# --------- 2. Dependencies ---------

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm ci

# --------- 3. Build ---------

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# --------- 4. Production ---------

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable
RUN apk add --no-cache curl

# Copy only needed files

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Install only production deps

RUN pnpm ci

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["pnpm", "start"]
