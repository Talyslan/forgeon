FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# ------- Dependencies -------
FROM base AS deps

RUN pnpm install --frozen-lockfile

# ------- Build -------
FROM deps AS builder

COPY . . # Copy source for build
RUN pnpm run build

# Stage 2: Production
FROM base AS runner

WORKDIR /app

# Copy built assets and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080

CMD ["node", "dist/server.js"]