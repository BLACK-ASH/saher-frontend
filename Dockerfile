
# --------- 1. Base ---------

FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# --------- 2. Dependencies ---------

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --------- 3. Build ---------

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

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

# Install only production deps

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["pnpm", "start"]
