"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Scene = { id: string; title: string; image_path: string };
type Hotzone = {
  id: string;
  label_ar: string;
  label_he: string;
  translit: string | null;
  x_pct: number;
  y_pct: number;
  radius_pct: number;
};

type PendingZone = { x_pct: number; y_pct: number } | null;

export default function PictureGameAdmin() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [hotzones, setHotzones] = useState<Hotzone[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hotzone popup
  const [pending, setPending] = useState<PendingZone>(null);
  const [popupAr, setPopupAr] = useState("");
  const [popupHe, setPopupHe] = useState("");
  const [popupTranslit, setPopupTranslit] = useState("");
  const [savingZone, setSavingZone] = useState(false);

  // Selected hotzone for deletion
  const [activeZone, setActiveZone] = useState<Hotzone | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  async function loadScenes() {
    const res = await fetch("/api/picture-scenes").then((r) => r.json());
    setScenes(res.scenes ?? []);
  }

  useEffect(() => { loadScenes(); }, []);

  async function selectScene(scene: Scene) {
    setSelectedScene(scene);
    setPending(null);
    setActiveZone(null);
    // Load hotzones
    const res = await fetch(`/api/picture-scenes/${scene.id}`).then((r) => r.json());
    setHotzones(res.hotzones ?? []);
    // Get signed image URL
    const urlRes = await fetch("/api/pictures/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: scene.image_path }),
    }).then((r) => r.json());
    setImageUrl(urlRes.url ?? null);
  }

  async function handleUpload() {
    if (!uploadFile || !newTitle.trim()) return;
    setUploading(true);
    setUploadError(null);

    const ext = uploadFile.name.split(".").pop() ?? "jpg";
    const { path, token, signedUrl, error: urlErr } = await fetch(
      "/api/pictures/upload-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extension: ext }),
      }
    ).then((r) => r.json());

    if (urlErr) { setUploadError(urlErr); setUploading(false); return; }

    const supabase = supabaseBrowser();
    const { error: upErr } = await supabase.storage
      .from("pictures")
      .uploadToSignedUrl(path, token, uploadFile);

    if (upErr) { setUploadError(upErr.message); setUploading(false); return; }

    const { scene, error: sceneErr } = await fetch("/api/picture-scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), image_path: path }),
    }).then((r) => r.json());

    if (sceneErr) { setUploadError(sceneErr); setUploading(false); return; }

    setNewTitle("");
    setUploadFile(null);
    await loadScenes();
    await selectScene(scene);
    setUploading(false);
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    if (!imgRef.current || activeZone) { setActiveZone(null); return; }
    const rect = imgRef.current.getBoundingClientRect();
    const x_pct = (e.clientX - rect.left) / rect.width;
    const y_pct = (e.clientY - rect.top) / rect.height;
    setPending({ x_pct, y_pct });
    setPopupAr("");
    setPopupHe("");
    setPopupTranslit("");
  }

  async function saveZone() {
    if (!pending || !selectedScene || !popupAr.trim() || !popupHe.trim()) return;
    setSavingZone(true);
    const res = await fetch("/api/picture-hotzones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_id: selectedScene.id,
        label_ar: popupAr.trim(),
        label_he: popupHe.trim(),
        translit: popupTranslit.trim() || null,
        x_pct: pending.x_pct,
        y_pct: pending.y_pct,
      }),
    }).then((r) => r.json());
    if (res.hotzone) setHotzones((prev) => [...prev, res.hotzone]);
    setPending(null);
    setSavingZone(false);
  }

  async function deleteZone(id: string) {
    await fetch(`/api/picture-hotzones/${id}`, { method: "DELETE" });
    setHotzones((prev) => prev.filter((z) => z.id !== id));
    setActiveZone(null);
  }

  async function deleteScene(id: string) {
    await fetch(`/api/picture-scenes/${id}`, { method: "DELETE" });
    setScenes((prev) => prev.filter((s) => s.id !== id));
    if (selectedScene?.id === id) {
      setSelectedScene(null);
      setHotzones([]);
      setImageUrl(null);
    }
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-56px)] overflow-hidden">
      {/* LEFT: Scene list */}
      <div className="w-64 border-l flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg mb-3">סצנות</h2>
          {/* Upload form */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="כותרת (עברית)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-full"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
            <button
              onClick={handleUpload}
              disabled={uploading || !newTitle.trim() || !uploadFile}
              className="bg-blue-600 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              {uploading ? "מעלה..." : "הוסף סצנה"}
            </button>
            {uploadError && (
              <p className="text-red-500 text-xs">{uploadError}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {scenes.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between px-4 py-2 cursor-pointer border-b hover:bg-gray-50 ${selectedScene?.id === s.id ? "bg-blue-50 font-bold" : ""}`}
              onClick={() => selectScene(s)}
            >
              <span className="truncate text-sm">{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteScene(s.id); }}
                className="text-red-400 hover:text-red-600 text-xs mr-1 shrink-0"
              >
                מחק
              </button>
            </div>
          ))}
          {scenes.length === 0 && (
            <p className="text-gray-400 text-sm p-4">אין סצנות עדיין</p>
          )}
        </div>
      </div>

      {/* RIGHT: Hotzone editor */}
      <div className="flex-1 overflow-auto bg-gray-100 relative flex flex-col items-center justify-start p-4">
        {!selectedScene && (
          <p className="text-gray-500 mt-20">בחר סצנה או הוסף חדשה</p>
        )}

        {selectedScene && imageUrl && (
          <div className="relative inline-block max-w-full">
            <img
              ref={imgRef}
              src={imageUrl}
              alt={selectedScene.title}
              className="max-w-full max-h-[80vh] object-contain cursor-crosshair select-none"
              onClick={handleImageClick}
              draggable={false}
            />

            {/* Existing hotzones */}
            {hotzones.map((hz) => (
              <button
                key={hz.id}
                title={`${hz.label_he} / ${hz.label_ar}`}
                className="absolute rounded-full border-2 border-white bg-blue-500 bg-opacity-50 hover:bg-opacity-80 transition-all flex items-center justify-center"
                style={{
                  left: `${hz.x_pct * 100}%`,
                  top: `${hz.y_pct * 100}%`,
                  width: `${hz.radius_pct * 2 * 100}%`,
                  aspectRatio: "1",
                  transform: "translate(-50%, -50%)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPending(null);
                  setActiveZone(activeZone?.id === hz.id ? null : hz);
                }}
              >
                <span className="text-white text-xs font-bold pointer-events-none drop-shadow">{hz.label_he}</span>
              </button>
            ))}

            {/* Pending new zone marker */}
            {pending && (
              <div
                className="absolute rounded-full border-2 border-yellow-400 bg-yellow-300 bg-opacity-50 pointer-events-none"
                style={{
                  left: `${pending.x_pct * 100}%`,
                  top: `${pending.y_pct * 100}%`,
                  width: "8%",
                  aspectRatio: "1",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

            {/* Popup for new hotzone */}
            {pending && (
              <div
                className="absolute z-10 bg-white shadow-lg rounded-lg p-3 w-52 border"
                style={{
                  left: `${Math.min(pending.x_pct * 100, 70)}%`,
                  top: `${Math.min(pending.y_pct * 100 + 6, 80)}%`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    placeholder="שם בערבית"
                    value={popupAr}
                    onChange={(e) => setPopupAr(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-full"
                    dir="rtl"
                  />
                  <input
                    placeholder="שם בעברית"
                    value={popupHe}
                    onChange={(e) => setPopupHe(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-full"
                    dir="rtl"
                  />
                  <input
                    placeholder="תעתיק (אופציונלי)"
                    value={popupTranslit}
                    onChange={(e) => setPopupTranslit(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-full"
                    dir="ltr"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveZone}
                      disabled={savingZone || !popupAr.trim() || !popupHe.trim()}
                      className="bg-blue-600 text-white rounded px-3 py-1 text-sm flex-1 disabled:opacity-50"
                    >
                      {savingZone ? "שומר..." : "שמור"}
                    </button>
                    <button
                      onClick={() => setPending(null)}
                      className="border rounded px-3 py-1 text-sm text-gray-600"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active zone info popup */}
            {activeZone && (
              <div
                className="absolute z-10 bg-white shadow-lg rounded-lg p-3 w-48 border"
                style={{
                  left: `${Math.min(activeZone.x_pct * 100, 70)}%`,
                  top: `${Math.min(activeZone.y_pct * 100 + 6, 80)}%`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="font-bold text-sm">{activeZone.label_he}</p>
                <p className="text-gray-600 text-sm">{activeZone.label_ar}</p>
                {activeZone.translit && (
                  <p className="text-gray-400 text-xs" dir="ltr">{activeZone.translit}</p>
                )}
                <button
                  onClick={() => deleteZone(activeZone.id)}
                  className="mt-2 text-red-500 text-sm hover:text-red-700"
                >
                  מחק אזור
                </button>
              </div>
            )}
          </div>
        )}

        {selectedScene && !imageUrl && (
          <p className="text-gray-500 mt-20">טוען תמונה...</p>
        )}
      </div>
    </div>
  );
}
