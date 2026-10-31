import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query('TRUNCATE votes, costumes RESTART IDENTITY CASCADE');
await pool.end();
console.log('Test data cleared.');
