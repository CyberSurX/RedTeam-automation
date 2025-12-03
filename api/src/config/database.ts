/**
 * Database configuration using Prisma Client
 */
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'info', 'warn', 'error'],
})

export const initializeDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect()
    console.log('✅ Prisma connected to database')
  } catch (error) {
    console.error('❌ Prisma connection failed:', error)
    process.exit(1)
  }
}

export const closeDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    console.log('✅ Prisma disconnected')
  } catch (error) {
    console.error('❌ Prisma disconnect failed:', error)
  }
}

// Lightweight query helpers to satisfy existing imports (for TypeORM-style queries)
export const query = async (sql: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount: number }> => {
  try {
    // For complex queries that can't be handled by Prisma, we'd need a raw SQL client
    // This is a temporary workaround - in a real implementation, use pg or similar
    console.warn(`Raw SQL query not fully implemented: ${sql.substring(0, 100)}...`);
    
    // Return a mock result to satisfy TypeScript
    return {
      rows: [],
      rowCount: 0
    };
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// Prisma-specific helpers for common operations
export const dbHelpers = {
  users: () => prisma.user,
  programs: () => prisma.program,
}
