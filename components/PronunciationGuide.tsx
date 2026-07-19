"use client";

import { useEffect, useRef, useState } from "react";

// Letters that have both a plain and geresh (') variant in this transliteration system
const PAIRS = [
  { plain: "ג", geresh: "ג׳", arabic: "ج", desc: "כמו ג׳ין (g רך)" },
  { plain: "ח", geresh: "ח׳", arabic: "خ", desc: "ח אשכנזית / כ רכה" },
  { plain: "ד", geresh: "ד׳", arabic: "ذ", desc: "בין ד לז (th של the)" },
  { plain: "ת", geresh: "ת׳", arabic: "ث", desc: "בין ת לס (th של think)" },
  { plain: "ט", geresh: "ט׳", arabic: "ظ", desc: "ז נחצית / עבה" },
  { plain: "ע", geresh: "ע׳", arabic: "غ", desc: "ר צרפתית (גרונית)" },
  { plain: "צ", geresh: "צ׳", arabic: "ض", desc: "צ עבה — ייחודית לערבית" },
];

export function PronunciationGuide() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`rounded px-2 py-0.5 text-xs font-medium border transition-colors ${
          open ? "bg-black text-white border-black" : "border-gray-300 text-gray-500"
        }`}
        title="מדריך הגייה"
      >
        הגייה
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border bg-white dark:bg-gray-900 shadow-lg p-3 text-sm">
          <p className="text-xs text-gray-400 mb-2 text-right">אותיות עם גרסה + גרש</p>
          <table className="w-full text-right">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="pb-1 font-normal">ללא גרש</th>
                <th className="pb-1 font-normal">עם גרש</th>
                <th className="pb-1 font-normal">ערבית</th>
                <th className="pb-1 font-normal text-left">הגייה</th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.map((p) => (
                <tr key={p.geresh} className="border-b last:border-0">
                  <td className="py-1.5 nikud-text font-bold">{p.plain}</td>
                  <td className="py-1.5 nikud-text font-bold text-purple-600 dark:text-purple-400">{p.geresh}</td>
                  <td className="py-1.5 text-base">{p.arabic}</td>
                  <td className="py-1.5 text-left text-gray-500 text-xs">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
