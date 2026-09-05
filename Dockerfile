# --------- 1. Base ---------

FROM node:24-alpine AS base
WORKDIR /app
# pnpm is not bundled; corepack's own fetch of the pnpm tarball is flaky in
# build-stage DNS, so install the pinned version directly via npm (matching
# package.json "packageManager": "pnpm@11.22.0")
RUN npm install -g pnpm@11.22.0
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# --------- 2. Dependencies ---------

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm ci

# --------- 3. Build ---------

FROM deps AS builder

COPY . .

ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

RUN pnpm build

# --------- 4. Production ---------

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

RUN npm install -g pnpm@11.22.0
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
