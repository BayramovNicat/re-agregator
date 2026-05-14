import { type Prisma, PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient.
 * Reuses the same instance across hot-reloads in development to avoid
 * exhausting the database connection pool.
 */

const QUERY_TIMEOUT_MS = 30_000;

function withStatementTimeout(
	databaseUrl: string | undefined,
): string | undefined {
	if (!databaseUrl) return undefined;

	const url = new URL(databaseUrl);
	if (!url.searchParams.has("statement_timeout")) {
		url.searchParams.set("statement_timeout", String(QUERY_TIMEOUT_MS));
	}
	return url.toString();
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const client =
	globalForPrisma.prisma ??
	new PrismaClient({
		datasources: {
			db: {
				url: withStatementTimeout(process.env.DATABASE_URL),
			},
		},
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = client;
}

export const prisma = client;

export function queryRaw<T = unknown>(
	query: TemplateStringsArray | Prisma.Sql,
	...values: unknown[]
): Promise<T> {
	// biome-ignore lint/suspicious/noExplicitAny: Prisma's $queryRaw requires dynamic invocation
	return (client.$queryRaw as any)(query, ...values) as Promise<T>;
}

export function executeRaw(
	query: TemplateStringsArray | Prisma.Sql,
	...values: unknown[]
): Promise<number> {
	// biome-ignore lint/suspicious/noExplicitAny: Prisma's $executeRaw requires dynamic invocation
	return (client.$executeRaw as any)(query, ...values) as Promise<number>;
}
