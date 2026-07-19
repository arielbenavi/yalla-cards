import { Pool } from "pg";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌  DATABASE_URL not set in .env.local");
    console.error(
      "   Get it from Supabase → Project Settings → Database → Connection string → Direct"
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    await client.query(`
      create table if not exists _schema_migrations (
        filename text primary key,
        applied_at timestamptz default now()
      )
    `);

    const { rows } = await client.query<{ filename: string }>(
      "select filename from _schema_migrations"
    );
    const applied = new Set(rows.map((r) => r.filename));

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
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into _schema_migrations (filename) values ($1)", [file]);
        await client.query("commit");
        console.log(`  apply ${file}`);
      } catch (err) {
        await client.query("rollback");
        console.error(`  error ${file}: ${(err as Error).message}`);
        throw err;
      }
    }

    console.log(pending === 0 ? "✓ already up to date" : `✓ applied ${pending} migration(s)`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
