FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Generate Prisma client
FROM deps AS prisma
COPY prisma ./prisma
RUN bunx prisma generate

# Build frontend
FROM deps AS build
COPY frontend ./frontend
COPY scripts ./scripts
RUN bun run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=prisma --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=prisma --chown=1001:1001 /app/prisma ./prisma
COPY --chown=1001:1001 src ./src
COPY --chown=1001:1001 scripts/update-active-mortgages.ts ./scripts/update-active-mortgages.ts
COPY --from=build --chown=1001:1001 /app/public ./public
COPY --chown=1001:1001 package.json tsconfig.json ./

USER 1001:1001

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun src/index.ts"]
