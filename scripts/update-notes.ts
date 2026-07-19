import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Done this session
  const doneIds = [
    "9fa5b297-4297-4503-a025-fa8fd9fb503e", // הצמדה מהירה - default create mode
    "f624a5a3-cd36-496f-9534-81db753c7373", // סינון יש/אין קליפים
  ];
  // Duplicate of 546563b9 (רמז + שוב)
  const dismissIds = [
    "cfbab807-7942-4ce7-b939-f324034c33f8",
  ];

  for (const id of doneIds) {
    const { error } = await s.from("notes").update({ status: "done" }).eq("id", id);
    if (error) console.error("done error", id, error);
    else console.log("marked done:", id);
  }

  for (const id of dismissIds) {
    const { error } = await s.from("notes").update({ status: "dismissed" }).eq("id", id);
    if (error) console.error("dismiss error", id, error);
    else console.log("dismissed:", id);
  }
}

main();
