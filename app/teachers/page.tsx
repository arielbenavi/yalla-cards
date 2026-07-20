import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "למורים – יאללה כרטיסים",
  description: "כלי לימוד לכיתות ערבית – תן לתלמידים שלך כלי חזרה מבוסס-SRS",
};

const steps = [
  {
    number: "1",
    title: "אתה מוסיף מילים",
    desc: "המורה מעלה רשימת מילים או מוסיף ידנית",
  },
  {
    number: "2",
    title: "התלמידים חוזרים",
    desc: "כרטיסיות SRS חוזרות לפי עקומת שכחה",
  },
  {
    number: "3",
    title: "אתה עוקב",
    desc: "סטטיסטיקות התקדמות לכל תלמיד",
  },
];

const features = [
  "בחירת אוצר מילים",
  "תמלול אוטומטי",
  "ייבוא הקלטות",
  "תרגול ערבית→עברית ועברית→ערבית",
];

export default function TeachersPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-14">
      {/* Hero */}
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold">כלי לימוד לכיתות ערבית</h1>
        <p className="text-lg text-gray-600">
          תן לתלמידים שלך כלי חזרה מבוסס-SRS על אוצר מילים שאתה בוחר
        </p>
        <div className="mt-2">
          <Link
            href="/signup"
            className="inline-block bg-black text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            התחל בחינם
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">איך זה עובד</h2>
        <div className="flex flex-col gap-4">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4 items-start border rounded-lg p-4">
              <span className="text-2xl font-bold text-gray-300 w-8 shrink-0">{step.number}</span>
              <div>
                <p className="font-bold">{step.title}</p>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">מה כלול</h2>
        <ul className="flex flex-col gap-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-4 items-center text-center border rounded-lg p-8">
        <p className="text-lg font-bold">מוכן להתחיל?</p>
        <Link
          href="/signup"
          className="inline-block bg-black text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          התחל בחינם
        </Link>
      </section>

      {/* Contact */}
      <section className="text-center text-gray-500 text-sm">
        <p>
          לשאלות:{" "}
          <a href="mailto:yalla.cards@gmail.com" className="underline hover:text-gray-700">
            yalla.cards@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}
