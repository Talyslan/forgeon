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
FROM deps AS build

COPY . .

RUN pnpm run build

# ------- Production -------
FROM base AS production

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=build /app/dist ./dist

CMD ["node", "dist/server.js"]