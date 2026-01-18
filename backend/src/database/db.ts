import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://nirnai_user:nirnai_password@localhost:5432/nirnai_db';

const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });

export async function closeDatabase() {
  await client.end();
}
