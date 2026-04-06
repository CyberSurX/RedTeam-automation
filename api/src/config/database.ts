import { AppDataSource } from './data-source.js';

// PostgreSQL query helper using TypeORM
export const query = async (sql: string, params?: unknown[]) => {
  const queryRunner = AppDataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    const result = await queryRunner.query(sql, params);
    return { rows: result };
  } finally {
    await queryRunner.release();
  }
};

export { AppDataSource };
