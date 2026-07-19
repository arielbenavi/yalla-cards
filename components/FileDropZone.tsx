"use client";

import { useRef, useState } from "react";

interface Props {
  accept?: string;
  multiple?: boolean;
  value: File[];
  onChange: (files: File[]) => void;
  hint?: string; // e.g. "תמונות JPG, PNG" or "קובץ ZIP"
}

function matchesAccept(file: File, accept: string): boolean {
  return accept.split(",").some((a) => {
    a = a.trim();
    if (a.startsWith(".")) return file.name.toLowerCase().endsWith(a);
    if (a.endsWith("/*")) return file.type.startsWith(a.replace("/*", "/"));
    return file.type === a;
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropZone({ accept, multiple, value, onChange, hint }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(raw: FileList | null) {
    if (!raw) return;
    let files = Array.from(raw);
    if (accept) files = files.filter((f) => matchesAccept(f, accept));
    onChange(multiple ? files : files.slice(0, 1));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const hasFiles = value.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
        onDrop={handleDrop}
        className={[
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors select-none",
          dragging
            ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950"
            : hasFiles
            ? "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900"
            : "border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-500",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          // allow re-selecting the same file
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        />

        {/* Icon */}
        <div className={`rounded-full p-3 ${dragging ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-800"}`}>
          {hasFiles ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-6 w-6 ${dragging ? "text-blue-500" : "text-green-600 dark:text-green-400"}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-6 w-6 ${dragging ? "text-blue-500" : "text-gray-400"}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>

        {/* Text */}
        {dragging ? (
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">שחרר כאן</p>
        ) : hasFiles ? (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            לחץ להחלפה
          </p>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              גרור לכאן או <span className="text-black dark:text-white underline underline-offset-2">לחץ לבחירה</span>
            </p>
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
          </div>
        )}
      </div>

      {/* Selected file chips */}
      {hasFiles && (
        <div className="flex flex-wrap gap-2">
          {value.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 flex-shrink-0 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="max-w-[180px] truncate">{f.name}</span>
              <span className="text-gray-400">{formatBytes(f.size)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onChange(value.filter((_, j) => j !== i)); }}
                className="mr-0.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="הסר קובץ"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
