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

RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 --ingroup app app

COPY --from=prisma --chown=app:app /app/node_modules ./node_modules
COPY --from=prisma --chown=app:app /app/prisma ./prisma
COPY --chown=app:app src ./src
COPY --from=build --chown=app:app /app/public ./public
COPY --chown=app:app package.json tsconfig.json ./

USER app

EXPOSE 3000

# Run migrations then start server
CMD bunx prisma migrate deploy && bun src/index.ts
