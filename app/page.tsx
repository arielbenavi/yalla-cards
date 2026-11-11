import { redirect } from "next/navigation";

// Opens on the daily review. The daily checklist (/today) left the menu on 2026-11-10 (Ariel);
// its route still resolves.
export default function Home() {
  redirect("/review");
}
