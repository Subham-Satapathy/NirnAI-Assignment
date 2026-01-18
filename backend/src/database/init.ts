import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://nirnai_user:nirnai_password@localhost:5433/nirnai_db';
  
  console.log('Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('Reading init.sql...');
    const initSql = readFileSync(join(__dirname, 'init.sql'), 'utf-8');
    
    console.log('Executing database initialization...');
    await sql.unsafe(initSql);
    
    console.log('[DATABASE] Database initialized successfully!');
  } catch (error) {
    console.error('[DATABASE ERROR] Database initialization failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

initDatabase();
