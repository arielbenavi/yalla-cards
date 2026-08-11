import { redirect } from "next/navigation";

// Lands on the daily checklist rather than straight into the review.
//
// The review itself is unchanged — the checklist links into it and shows the
// count — but a checklist he has to navigate to is a checklist he will not see,
// and not seeing the inflection line is exactly the problem it exists to fix:
// "אני מרגיש שאני לא מתרגל את זה כמעט".
export default function Home() {
  redirect("/today");
}
