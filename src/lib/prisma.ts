import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // The generated client requires either an adapter or accelerateUrl.
  // When using Supabase with a direct PostgreSQL connection, we need to use
  // the prisma-postgres adapter approach or supply a URL.
  // For Supabase, we pass the DATABASE_URL as the accelerateUrl.
  const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";

  return new PrismaClient({
    accelerateUrl: databaseUrl,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
