import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Apply 0011 migration via raw SQL using rpc if available,
  // otherwise print instructions
  const sql = `
    alter table recordings add column if not exists source_filename text;
    create unique index if not exists recordings_source_filename_key
      on recordings(source_filename)
      where source_filename is not null;
  `;
  // Supabase JS client doesn't expose raw SQL — user must run in dashboard
  console.log("Apply this SQL in the Supabase SQL editor:");
  console.log(sql);
}

main();
