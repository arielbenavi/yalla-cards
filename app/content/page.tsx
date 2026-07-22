type Resource = { name: string; url: string; note?: string };
type Section = { title: string; emoji: string; items: Resource[] };

const sections: Section[] = [
  {
    title: "סרטונים בערבית",
    emoji: "🎬",
    items: [
      { name: "ג'ארכ קריבכ", url: "https://youtube.com/playlist?list=PLKt8C3lDdAokazgysoWRjS8z1AzO510RC" },
      { name: "ג'ארכ קריבכ — סרטון בודד", url: "https://youtu.be/xLQcSu10pkE" },
      { name: "סלם ותעלם", url: "https://youtube.com/playlist?list=PLV2YW4LPjpJpnRiPu772xPc7EmZuprJQY" },
      { name: "תעלם ותכלם", url: "https://www.youtube.com/playlist?list=PLIr-4jfMHt_piGTK87hdY0UXxqPvKE6t6" },
      { name: "סליחה על השאלה", url: "https://youtube.com/playlist?list=PLLttfoK87AdXhODrYZOCru0BWV6vnWOpW" },
      { name: "סליחה על השאלה 2", url: "https://youtube.com/playlist?list=PL1QztFTkh_cfqN2OcYFrw1J8uj1i0TIV4" },
      { name: "בלא מאאח'ד'ה", url: "https://youtube.com/playlist?list=PL1QztFTkh_ccR6oXAsrrQ4OtQkhqHP4ve" },
      { name: "בנפע סאאל?", url: "https://youtube.com/shorts/rkqaLvOmBXg" },
      { name: "אחכי ללכמירא", url: "https://youtube.com/playlist?list=PL1QztFTkh_cd9_BLhjcYpAmGM_duyE39N" },
      { name: "אמי היא סבתי", url: "https://youtu.be/6GnMFeaTmtY" },
      { name: "קצתי קצה", url: "https://youtube.com/playlist?list=PL1QztFTkh_cftuKAmI0u31SxnIXobxpaa" },
      { name: "מידיה של סבתי", url: "https://youtube.com/playlist?list=PL1QztFTkh_ceWyvkhtRXCJQ3lVMhSM61E" },
    ],
  },
  {
    title: "סדרות בערבית",
    emoji: "📺",
    items: [
      { name: "בואו לאכול איתי", url: "https://www.kan.org.il/content/kan/kan-11/p-11843/", note: "כאן 11" },
      { name: "המסעדה הגדולה", url: "https://www.kan.org.il/content/archive1/vod/p-882497/", note: "כאן" },
      { name: "קרוב רחוק – קרבה ע'רבה", url: "https://youtube.com/playlist?list=PLLttfoK87AdVUConb7o7fVRjgqwhLnQFy" },
      { name: "דוקטור כראג'", url: "https://youtu.be/EsEtEb9w-ns" },
      { name: "התסריטאי", url: "https://www.kan.org.il/content/kan/kan-11/p-13835/", note: "כאן 11" },
      { name: "סאדה", url: "https://www.makan.org.il/content/makan/makan-tv/p-991014/%D8%AC%D9%85%D9%8A%D8%B9-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A7%D8%AA/994806/", note: "מכאן" },
    ],
  },
  {
    title: "סרטים",
    emoji: "🎥",
    items: [
      { name: "בית לחם", url: "https://youtu.be/DnqZHlbjO8M" },
      { name: "עג'מי", url: "https://youtu.be/HykbkPiPHE0" },
      { name: "ודיע עביד", url: "https://youtube.com/shorts/8vcgiX4yqPw" },
    ],
  },
  {
    title: "אתרים",
    emoji: "🌐",
    items: [
      { name: "Videos in Arabic", url: "https://videosinarabic.com/", note: "סרטונים עם כתוביות ותרגום בעברית" },
    ],
  },
  {
    title: "מוזיקה ואינסטגרם",
    emoji: "🎵",
    items: [
      { name: "פלייליסט ספוטיפיי", url: "https://open.spotify.com/playlist/5nxtGG6nozP8MVpCKZvu9r" },
      { name: "hanan_motran_", url: "https://www.instagram.com/hanan_motran_", note: "ילדה שמכינה אוכל, מדברת עברית וערבית" },
    ],
  },
];

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 shrink-0">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function ContentPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">תכנים לצפייה ולהאזנה</h1>
        <p className="text-sm text-gray-500 mt-1">המלצות R.D לחשיפה לערבית פלסטינית מדוברת</p>
      </div>

      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <span>{section.emoji}</span>
            <span>{section.title}</span>
          </h2>
          <div className="flex flex-col gap-1.5">
            {section.items.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium text-sm truncate">{item.name}</span>
                  {item.note && (
                    <span className="text-xs text-gray-400">{item.note}</span>
                  )}
                </div>
                <ExternalLinkIcon />
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
