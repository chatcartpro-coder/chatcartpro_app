// Applies the hand-written RLS policy SQL against DATABASE_URL. Prisma's
// migration system doesn't express row-level security, so this runs as a
// separate step after `prisma migrate deploy` (see package.json scripts).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "../prisma/migrations_manual/001_rls_policies.sql");
const sql = readFileSync(sqlPath, "utf8");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

try {
  await client.connect();
  await client.query(sql);
  console.log("RLS policies applied.");
} catch (err) {
  console.error("Failed to apply RLS policies:", err);
  process.exit(1);
} finally {
  await client.end();
}
