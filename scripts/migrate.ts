/**
 * Applies pending migrations in supabase/migrations/ via the Supabase
 * Management API (no direct PostgreSQL connection needed).
 *
 * Requires in .env.local:
 *   SUPABASE_ACCESS_TOKEN — personal access token from
 *   https://supabase.com/dashboard/account/tokens
 */
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const PROJECT_REF = "tpksmcxysqjanxwvtbow";
const MGMT = "https://api.supabase.com/v1";

async function runSQL(token: string, sql: string): Promise<void> {
  const res = await fetch(`${MGMT}/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error("❌  SUPABASE_ACCESS_TOKEN not set in .env.local");
    console.error(
      "   Create one at: https://supabase.com/dashboard/account/tokens"
    );
    process.exit(1);
  }

  // Ensure tracking table exists
  await runSQL(
    token,
    `create table if not exists _schema_migrations (
       filename text primary key,
       applied_at timestamptz default now()
     )`
  );

  const appliedRes = await fetch(
    `${MGMT}/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: "select filename from _schema_migrations" }),
    }
  );
  const { rows } = (await appliedRes.json()) as { rows: { filename: string }[] };
  const applied = new Set((rows ?? []).map((r) => r.filename));

  const dir = join(process.cwd(), "supabase/migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  let pending = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file}`);
      continue;
    }
    pending++;
    const sql = await readFile(join(dir, file), "utf8");
    try {
      await runSQL(token, sql);
      await runSQL(
        token,
        `insert into _schema_migrations (filename) values ('${file.replace(/'/g, "''")}')`
      );
      console.log(`  apply ${file}`);
    } catch (err) {
      console.error(`  error ${file}: ${(err as Error).message}`);
      throw err;
    }
  }

  console.log(pending === 0 ? "✓ already up to date" : `✓ applied ${pending} migration(s)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
