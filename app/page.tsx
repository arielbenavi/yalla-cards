import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IN_APP_UA } from "@/lib/nav";

// Lands on the daily checklist rather than straight into the review.
//
// The review itself is unchanged — the checklist links into it and shows the
// count — but a checklist he has to navigate to is a checklist he will not see,
// and not seeing the inflection line is exactly the problem it exists to fix:
// "אני מרגיש שאני לא מתרגל את זה כמעט".
//
// The iPhone app opens on the review instead (its first tab, used every day).
export default async function Home() {
  const ua = (await headers()).get("user-agent") ?? "";
  redirect(ua.includes(IN_APP_UA) ? "/review" : "/today");
}
