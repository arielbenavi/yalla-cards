import Link from "next/link";
import { strings } from "@/lib/strings";
import { adminLinks } from "@/lib/nav";

// The screens for managing the deck, in one place (proxy.ts keeps them admin only).
export default function AdminPage() {
  return (
    <div className="flex flex-col flex-1 p-4 gap-4 max-w-md mx-auto w-full">
      <h1 className="text-xl font-bold">{strings.nav.admin}</h1>
      <div className="grid grid-cols-1 divide-y overflow-hidden rounded-2xl border">
        {adminLinks.map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center justify-between p-4 font-bold hover:bg-gray-50">
            {l.label}
            <span className="font-normal text-gray-300">←</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
