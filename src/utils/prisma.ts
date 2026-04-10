import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient.
 * Reuses the same instance across hot-reloads in development to avoid
 * exhausting the database connection pool.
 */

const QUERY_TIMEOUT_MS = 30_000;

function raceTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Prisma query exceeded ${QUERY_TIMEOUT_MS}ms`)),
        QUERY_TIMEOUT_MS,
      )
    ),
  ]);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = client;
}

export const prisma = client.$extends({
  query: {
    $allModels: {
      $allOperations({ args, query }) {
        return raceTimeout(query(args));
      },
    },
  },
});
