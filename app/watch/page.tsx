import WatchList from "@/components/WatchList";

/** Short scenes with transliteration you can tap. The same list opens תכנים. */
export default function WatchPage() {
  return (
    <div className="flex flex-col flex-1 p-4 gap-5 max-w-md mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold">סרטונים עם תעתיק</h1>
        <p className="text-sm text-gray-500 mt-1">לחיצה על מילה עוצרת את הסרטון, מתרגמת, ומאפשרת להוסיף אותה ככרטיס.</p>
      </div>
      <WatchList />
    </div>
  );
}
