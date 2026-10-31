import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schema = readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await pool.query(statement);
  console.log('OK:', statement.slice(0, 60).replace(/\s+/g, ' '));
}

await pool.end();
console.log('Migration done.');
