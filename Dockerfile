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

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/prisma ./prisma
COPY src ./src
COPY public ./public
COPY package.json ./

EXPOSE 3000

# Run migrations then start server
CMD bunx prisma migrate deploy && bun src/index.ts
