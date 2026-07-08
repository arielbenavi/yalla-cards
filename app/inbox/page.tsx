"use client";

import { useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";
import { config } from "@/lib/config";
import {
  unzipChatExport,
  parseChatText,
  distinctSenders,
  isVoiceNoteFilename,
  type ChatMessage,
} from "@/lib/whatsapp";
import { uploadAndTranscribeRecording } from "@/lib/recording-upload";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { emptyBatchRow, findItemNumberGaps, type BatchRow, type BatchSummary, type RawInput } from "@/lib/batches";
import { getPdfPageCount, renderPdfPagesToImages } from "@/lib/pdf";

type Row = BatchRow;
type Lesson = { id: string; date: string; title: string | null };

const typeLabels: Record<Row["item_type"], string> = {
  word: strings.inbox.typeWord,
  phrase: strings.inbox.typePhrase,
  sentence: strings.inbox.typeSentence,
};

const sourceLabels: Record<BatchSummary["source"], string> = {
  paste: strings.inbox.batchSourcePaste,
  photo: strings.inbox.batchSourcePhoto,
  whatsapp: strings.inbox.batchSourceWhatsapp,
  pdf: strings.inbox.batchSourcePdf,
};

async function uploadToImports(file: File): Promise<string> {
  const extension = file.name.match(/\.[^.]+$/)?.[0]?.replace(".", "") || "bin";
  const { path, token } = await fetch("/api/inbox/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ extension }),
  }).then((r) => r.json());

  const supabase = supabaseBrowser();
  const { error } = await supabase.storage.from("imports").uploadToSignedUrl(path, token, file);
  if (error) throw new Error(error.message);
  return path;
}

async function createBatch(source: RawInput["source"], lessonId: string, rawInput: RawInput, rows: Row[]) {
  const { batch } = await fetch("/api/inbox/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, lesson_id: lessonId || null, raw_input: rawInput, parsed_rows: rows }),
  }).then((r) => r.json());
  return batch as { id: string };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function gapWarningText(items: Row[]): string | null {
  const gaps = findItemNumberGaps(items);
  if (gaps.length === 0) return null;
  const parts = gaps.map((g) =>
    g.nearPages.length > 0
      ? `${g.number} (${strings.inbox.pdfGapPagesHint} ${g.nearPages.join("-")})`
      : String(g.number)
  );
  return `${strings.inbox.pdfGapWarningPrefix}: ${parts.join(", ")}`;
}

export default function InboxPage() {
  const [tab, setTab] = useState<"paste" | "photo" | "whatsapp" | "pdf">("paste");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState<string>("");

  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentBatchSource, setCurrentBatchSource] = useState<RawInput["source"] | null>(null);
  const [reparsing, setReparsing] = useState(false);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [showBatchList, setShowBatchList] = useState(false);
  const [gapWarning, setGapWarning] = useState<string | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [pdfFromPage, setPdfFromPage] = useState(1);
  const [pdfToPage, setPdfToPage] = useState(1);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

  const [zipFile, setZipFile] = useState<File | null>(null);
  const [waStep, setWaStep] = useState<"pick-zip" | "pick-teacher" | "processing">("pick-zip");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mediaFiles, setMediaFiles] = useState<Map<string, File>>(new Map());
  const [senders, setSenders] = useState<string[]>([]);
  const [teacherSender, setTeacherSender] = useState("");
  const [waStatus, setWaStatus] = useState<string | null>(null);
  const [waCursor, setWaCursor] = useState<Date | null>(null);
  const [waImportAll, setWaImportAll] = useState(false);
  const [waPendingCursor, setWaPendingCursor] = useState<{ chatIdentifier: string; lastImportedAt: string } | null>(
    null
  );

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((d) => setLessons(d.lessons ?? []));
    loadBatches();
  }, []);

  useEffect(() => {
    if (!teacherSender) {
      setWaCursor(null);
      return;
    }
    fetch(`/api/inbox/whatsapp-cursor?chat_identifier=${encodeURIComponent(teacherSender)}`)
      .then((r) => r.json())
      .then((d) => setWaCursor(d.last_imported_at ? new Date(d.last_imported_at) : null));
  }, [teacherSender]);

  async function loadBatches() {
    const data = await fetch("/api/inbox/batches").then((r) => r.json());
    setBatches(data.batches ?? []);
  }

  async function reopenBatch(id: string) {
    const { batch } = await fetch(`/api/inbox/batches/${id}`).then((r) => r.json());
    setCurrentBatchId(batch.id);
    setCurrentBatchSource(batch.source);
    setRows(batch.parsed_rows ?? []);
    setLessonId(batch.lesson_id ?? "");
    setCommitted(false);
    setShowBatchList(false);
    setGapWarning(batch.source === "pdf" ? gapWarningText(batch.parsed_rows ?? []) : null);
  }

  async function reparsePdfBatch() {
    if (!currentBatchId) return;
    setReparsing(true);
    try {
      const { batch } = await fetch(`/api/inbox/batches/${currentBatchId}`).then((r) => r.json());
      const rawInput = batch.raw_input as RawInput & { source: "pdf" };
      const newRows: Row[] = [];

      for (let i = 0; i < rawInput.page_image_paths.length; i++) {
        const pageNumber = rawInput.page_range.from + i;
        setPdfStatus(`${strings.inbox.pdfExtracting} (${i + 1}/${rawInput.page_image_paths.length})`);

        const { url } = await fetch(
          `/api/inbox/imports-url?path=${encodeURIComponent(rawInput.page_image_paths[i])}`
        ).then((r) => r.json());
        const imageBlob = await fetch(url).then((r) => r.blob());
        const base64 = await blobToBase64(imageBlob);

        const { items } = await fetch("/api/inbox/pdf-extract-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: "image/png" }),
        }).then((r) => r.json());

        newRows.push(
          ...(items ?? []).map((it: Partial<Row>) => ({ ...emptyBatchRow(), ...it, page_number: pageNumber }))
        );
      }

      const committedRows = rows.filter((r) => r.committed);
      const merged = [...committedRows, ...newRows];
      setRows(merged);
      setGapWarning(gapWarningText(merged));
    } finally {
      setPdfStatus(null);
      setReparsing(false);
    }
  }

  async function reparseCurrentBatch() {
    if (!currentBatchId) return;
    if (currentBatchSource === "pdf") return reparsePdfBatch();

    setReparsing(true);
    try {
      const { rows: newRows } = await fetch(`/api/inbox/batches/${currentBatchId}/reparse`, {
        method: "POST",
      }).then((r) => r.json());
      const committedRows = rows.filter((r) => r.committed);
      setRows([...committedRows, ...(newRows ?? [])]);
    } finally {
      setReparsing(false);
    }
  }

  async function submitText() {
    setParsing(true);
    setCommitted(false);
    setWaPendingCursor(null);
    setGapWarning(null);
    const res = await fetch("/api/inbox/parse-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setParsing(false);
    const parsedRows: Row[] = (data.rows ?? []).map((r: Partial<Row>) => ({ ...emptyBatchRow(), ...r }));
    setRows(parsedRows);
    const batch = await createBatch("paste", lessonId, { source: "paste", text }, parsedRows);
    setCurrentBatchId(batch.id);
    setCurrentBatchSource("paste");
    loadBatches();
  }

  async function submitImages() {
    setParsing(true);
    setCommitted(false);
    setWaPendingCursor(null);
    setGapWarning(null);

    const imagePaths = await Promise.all(files.map(uploadToImports));

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    const res = await fetch("/api/inbox/parse-image", { method: "POST", body: formData });
    const data = await res.json();
    setParsing(false);
    const parsedRows: Row[] = (data.rows ?? []).map((r: Partial<Row>) => ({ ...emptyBatchRow(), ...r }));
    setRows(parsedRows);
    const batch = await createBatch("photo", lessonId, { source: "photo", image_paths: imagePaths }, parsedRows);
    setCurrentBatchId(batch.id);
    setCurrentBatchSource("photo");
    loadBatches();
  }

  async function handleUnzip() {
    if (!zipFile) return;
    setWaStatus(strings.inbox.whatsappUnzipping);
    setWaPendingCursor(null);
    setWaImportAll(false);
    try {
      const { chatText, mediaFiles: media } = await unzipChatExport(zipFile);
      const messages = parseChatText(chatText);
      const detectedSenders = distinctSenders(messages);
      setChatMessages(messages);
      setMediaFiles(media);
      setSenders(detectedSenders);
      const defaultSender =
        detectedSenders.find((s) => s === config.defaultWhatsappTeacherName) ??
        detectedSenders.find((s) => s.includes(config.defaultWhatsappTeacherName)) ??
        detectedSenders[0] ??
        "";
      setTeacherSender(defaultSender);
      setWaStep("pick-teacher");
    } finally {
      setWaStatus(null);
    }
  }

  async function processWhatsApp() {
    if (!teacherSender) return;
    setWaStep("processing");
    setCommitted(false);

    const cutoff = waImportAll ? null : waCursor;
    const teacherMessages = chatMessages
      .filter((m) => m.sender === teacherSender)
      .filter((m) => !cutoff || m.timestamp > cutoff);

    if (teacherMessages.length > 0) {
      const maxTimestamp = teacherMessages.reduce(
        (max, m) => (m.timestamp > max ? m.timestamp : max),
        teacherMessages[0].timestamp
      );
      setWaPendingCursor({ chatIdentifier: teacherSender, lastImportedAt: maxTimestamp.toISOString() });
    }

    const textEntries = teacherMessages
      .map((m, index) => ({ m, index }))
      .filter(({ m }) => !m.attachmentFilename && m.text.trim());

    const voiceNoteEntries = teacherMessages
      .filter((m) => m.attachmentFilename && isVoiceNoteFilename(m.attachmentFilename))
      .map((m) => ({ timestamp: m.timestamp, file: mediaFiles.get(m.attachmentFilename!) }))
      .filter((v): v is { timestamp: Date; file: File } => !!v.file);

    const uploadedRecordings: { id: string; timestamp: Date }[] = [];
    for (let i = 0; i < voiceNoteEntries.length; i++) {
      setWaStatus(`${strings.inbox.whatsappUploadingVoiceNotes} (${i + 1}/${voiceNoteEntries.length})`);
      const { file, timestamp } = voiceNoteEntries[i];
      const { id } = await uploadAndTranscribeRecording(file, {
        lessonId: lessonId || null,
        maxAutoTranscribeDurationSec: config.autoTranscribeMaxDurationSec,
        autoTag: { maxDurationSec: config.dailyProverbMaxDurationSec, tag: config.dailyProverbTag },
      });
      uploadedRecordings.push({ id, timestamp });
    }

    setWaStatus(strings.inbox.whatsappParsing);
    const messages = textEntries.map(({ m, index }) => ({ index, text: m.text }));
    const { rows: parsedRows } = await fetch("/api/inbox/parse-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }).then((r) => r.json());

    const withRecording: Row[] = (parsedRows ?? []).map((row: Row & { source_index: number }) => {
      const sourceTimestamp = teacherMessages[row.source_index]?.timestamp;
      let recordingId: string | null = null;
      if (sourceTimestamp && uploadedRecordings.length > 0) {
        let best = uploadedRecordings[0];
        let bestDiff = Math.abs(sourceTimestamp.getTime() - best.timestamp.getTime());
        for (const rec of uploadedRecordings.slice(1)) {
          const diff = Math.abs(sourceTimestamp.getTime() - rec.timestamp.getTime());
          if (diff < bestDiff) {
            best = rec;
            bestDiff = diff;
          }
        }
        recordingId = best.id;
      }
      const { source_index, ...rest } = row;
      void source_index;
      return { ...emptyBatchRow(), ...rest, recording_id: recordingId };
    });

    setRows(withRecording);
    setGapWarning(null);
    const batch = await createBatch(
      "whatsapp",
      lessonId,
      { source: "whatsapp", chat_identifier: teacherSender, messages },
      withRecording
    );
    setCurrentBatchId(batch.id);
    setCurrentBatchSource("whatsapp");
    loadBatches();

    setWaStatus(null);
    setWaStep("pick-zip");
    setZipFile(null);
    setChatMessages([]);
    setMediaFiles(new Map());
    setSenders([]);
    setTeacherSender("");
  }

  async function handlePdfFileChange(file: File | null) {
    setPdfFile(file);
    setPdfPageCount(null);
    if (!file) return;
    const count = await getPdfPageCount(file);
    setPdfPageCount(count);
    setPdfFromPage(1);
    setPdfToPage(1);
  }

  async function handlePdfImport() {
    if (!pdfFile) return;
    setCommitted(false);
    setWaPendingCursor(null);
    setPdfStatus(strings.inbox.pdfRendering);

    const pages = await renderPdfPagesToImages(pdfFile, pdfFromPage, pdfToPage, (done, total) => {
      setPdfStatus(`${strings.inbox.pdfRendering} (${done}/${total})`);
    });

    const pageImagePaths: string[] = [];
    const extractedRows: Row[] = [];

    for (let i = 0; i < pages.length; i++) {
      const { pageNumber, blob } = pages[i];
      setPdfStatus(`${strings.inbox.pdfExtracting} (${i + 1}/${pages.length})`);

      const file = new File([blob], `page-${pageNumber}.png`, { type: "image/png" });
      pageImagePaths.push(await uploadToImports(file));

      const base64 = await blobToBase64(blob);
      const { items } = await fetch("/api/inbox/pdf-extract-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType: "image/png" }),
      }).then((r) => r.json());

      extractedRows.push(
        ...(items ?? []).map((it: Partial<Row>) => ({ ...emptyBatchRow(), ...it, page_number: pageNumber }))
      );
    }

    setRows(extractedRows);
    setGapWarning(gapWarningText(extractedRows));

    const batch = await createBatch(
      "pdf",
      lessonId,
      { source: "pdf", page_image_paths: pageImagePaths, page_range: { from: pdfFromPage, to: pdfToPage } },
      extractedRows
    );
    setCurrentBatchId(batch.id);
    setCurrentBatchSource("pdf");
    loadBatches();

    setPdfStatus(null);
  }

  function playLinkedRecording(recordingId: string) {
    fetch(`/api/recordings/${recordingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.audio_url && previewAudioRef.current) {
          previewAudioRef.current.src = d.audio_url;
          previewAudioRef.current.play();
        }
      });
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function deleteRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyBatchRow()]);
  }

  async function commit() {
    const toCommit = rows.filter((r) => !r.committed);
    if (toCommit.length === 0) return;

    setCommitting(true);
    const { cards } = await fetch("/api/inbox/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: toCommit.map(({ hebrew_meaning, translit_nikud, item_type, notes, recording_id, arabic_script }) => ({
          hebrew_meaning,
          translit_nikud,
          item_type,
          notes,
          recording_id,
          arabic_script,
        })),
        lesson_id: lessonId || null,
      }),
    }).then((r) => r.json());

    let cardIdx = 0;
    const updatedRows = rows.map((r) =>
      r.committed ? r : { ...r, committed: true, card_id: cards?.[cardIdx++]?.id ?? null }
    );
    setRows(updatedRows);

    if (currentBatchId) {
      await fetch(`/api/inbox/batches/${currentBatchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed_rows: updatedRows }),
      });
    }

    if (waPendingCursor) {
      await fetch("/api/inbox/whatsapp-cursor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_identifier: waPendingCursor.chatIdentifier,
          last_imported_at: waPendingCursor.lastImportedAt,
        }),
      });
      setWaPendingCursor(null);
      setWaCursor(new Date(waPendingCursor.lastImportedAt));
    }

    setCommitting(false);
    setCommitted(true);
    loadBatches();
  }

  const uncommittedCount = rows.filter((r) => !r.committed).length;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{strings.inbox.title}</h1>

      <label className="flex flex-col gap-1">
        <span>{strings.inbox.lessonLabel}</span>
        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">{strings.inbox.noLesson}</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title || l.date}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={() => setShowBatchList((v) => !v)}
        className="self-start text-sm underline text-gray-600"
      >
        {showBatchList ? strings.inbox.batchListToggleHide : strings.inbox.batchListToggleShow}
      </button>

      {showBatchList && (
        <div className="flex flex-col gap-2 border rounded p-3">
          <h2 className="font-bold">{strings.inbox.batchListTitle}</h2>
          {batches.length === 0 ? (
            <p className="text-gray-500 text-sm">{strings.inbox.batchListEmpty}</p>
          ) : (
            batches.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b py-2 text-sm">
                <span>
                  {sourceLabels[b.source]} · {b.lesson?.title || b.lesson?.date || strings.inbox.noLesson} ·{" "}
                  {b.committed_rows}/{b.total_rows}
                </span>
                <button onClick={() => reopenBatch(b.id)} className="text-blue-700 underline">
                  {strings.inbox.batchReopen}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex gap-4 border-b flex-wrap">
        <button
          onClick={() => setTab("paste")}
          className={tab === "paste" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
        >
          {strings.inbox.pasteTab}
        </button>
        <button
          onClick={() => setTab("photo")}
          className={tab === "photo" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
        >
          {strings.inbox.photoTab}
        </button>
        <button
          onClick={() => setTab("whatsapp")}
          className={tab === "whatsapp" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
        >
          {strings.inbox.whatsappTab}
        </button>
        <button
          onClick={() => setTab("pdf")}
          className={tab === "pdf" ? "font-bold border-b-2 border-black pb-2" : "text-gray-500 pb-2"}
        >
          {strings.inbox.pdfTab}
        </button>
      </div>

      {tab === "paste" ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span>{strings.inbox.pasteLabel}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="border rounded px-3 py-2 nikud-text"
            />
          </label>
          <button
            onClick={submitText}
            disabled={parsing || !text.trim()}
            className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {parsing ? strings.inbox.parsing : strings.inbox.pasteSubmit}
          </button>
        </div>
      ) : tab === "photo" ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span>{strings.inbox.photoLabel}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          <button
            onClick={submitImages}
            disabled={parsing || files.length === 0}
            className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {parsing ? strings.inbox.parsing : strings.inbox.photoSubmit}
          </button>
        </div>
      ) : tab === "whatsapp" ? (
        <div className="flex flex-col gap-2">
          {waStep === "pick-zip" && (
            <>
              <label className="flex flex-col gap-1">
                <span>{strings.inbox.whatsappZipLabel}</span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                onClick={handleUnzip}
                disabled={!zipFile || waStatus !== null}
                className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
              >
                {waStatus ?? strings.inbox.whatsappUnzip}
              </button>
            </>
          )}
          {waStep === "pick-teacher" && (
            <>
              <label className="flex flex-col gap-1">
                <span>{strings.inbox.whatsappTeacherLabel}</span>
                <select
                  value={teacherSender}
                  onChange={(e) => setTeacherSender(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  {senders.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {waCursor && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-600">
                    {strings.inbox.whatsappCursorNotice} {waCursor.toLocaleDateString("he-IL")}
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={waImportAll}
                      onChange={(e) => setWaImportAll(e.target.checked)}
                    />
                    {strings.inbox.whatsappImportAll}
                  </label>
                </div>
              )}
              <button
                onClick={processWhatsApp}
                disabled={!teacherSender}
                className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
              >
                {strings.inbox.whatsappTeacherContinue}
              </button>
            </>
          )}
          {waStep === "processing" && <p className="text-gray-500">{waStatus}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span>{strings.inbox.pdfFileLabel}</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handlePdfFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {pdfPageCount !== null && (
            <p className="text-sm text-gray-500">
              {strings.inbox.pdfPageCountLabel}: {pdfPageCount}
            </p>
          )}
          <div className="flex items-center gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">{strings.inbox.pdfFromPage}</span>
              <input
                type="number"
                min={1}
                max={pdfPageCount ?? undefined}
                value={pdfFromPage}
                onChange={(e) => setPdfFromPage(Number(e.target.value))}
                className="border rounded px-2 py-1 w-20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">{strings.inbox.pdfToPage}</span>
              <input
                type="number"
                min={1}
                max={pdfPageCount ?? undefined}
                value={pdfToPage}
                onChange={(e) => setPdfToPage(Number(e.target.value))}
                className="border rounded px-2 py-1 w-20"
              />
            </label>
          </div>
          <button
            onClick={handlePdfImport}
            disabled={!pdfFile || pdfStatus !== null || pdfFromPage > pdfToPage}
            className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {pdfStatus ?? strings.inbox.pdfImport}
          </button>
        </div>
      )}

      {gapWarning && (
        <p className="text-orange-700 bg-orange-50 border border-orange-400 rounded p-3 text-sm">{gapWarning}</p>
      )}

      {committed && <p className="text-green-700">{strings.inbox.committed}</p>}

      <audio ref={previewAudioRef} className="hidden" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{strings.inbox.tableTitle}</h2>
          {currentBatchId && (
            <button
              onClick={reparseCurrentBatch}
              disabled={reparsing}
              className="text-sm underline text-blue-700 disabled:opacity-50"
            >
              {reparsing ? strings.inbox.batchReparsing : strings.inbox.batchReparse}
            </button>
          )}
        </div>
        {rows.length === 0 ? (
          <p className="text-gray-500">{strings.inbox.emptyState}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row, i) =>
              row.committed ? (
                <div key={i} className="flex items-center gap-2 border rounded p-3 bg-gray-50 text-gray-500">
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                    {strings.inbox.committedBadge}
                  </span>
                  <span className="nikud-text">{row.translit_nikud}</span>
                  <span>—</span>
                  <span className="nikud-text">{row.hebrew_meaning}</span>
                </div>
              ) : (
                <div
                  key={i}
                  className={`flex flex-col gap-2 border rounded p-3 ${
                    row.confidence === "low" ? "border-orange-400 bg-orange-50" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-gray-500">{strings.inbox.colTranslit}</span>
                      <input
                        value={row.translit_nikud}
                        onChange={(e) => updateRow(i, { translit_nikud: e.target.value })}
                        className="border rounded px-2 py-1 nikud-text"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-gray-500">{strings.inbox.colMeaning}</span>
                      <input
                        value={row.hebrew_meaning}
                        onChange={(e) => updateRow(i, { hebrew_meaning: e.target.value })}
                        className="border rounded px-2 py-1 nikud-text"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-gray-500">{strings.inbox.colArabicScript}</span>
                      <input
                        dir="rtl"
                        value={row.arabic_script ?? ""}
                        onChange={(e) => updateRow(i, { arabic_script: e.target.value || null })}
                        className="border rounded px-2 py-1"
                      />
                    </label>
                    {row.item_number !== null && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">{strings.inbox.colItemNumber}</span>
                        <input
                          type="number"
                          value={row.item_number ?? ""}
                          onChange={(e) =>
                            updateRow(i, { item_number: e.target.value ? Number(e.target.value) : null })
                          }
                          className="border rounded px-2 py-1"
                        />
                      </label>
                    )}
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">{strings.inbox.colNotes}</span>
                    <input
                      value={row.notes}
                      onChange={(e) => updateRow(i, { notes: e.target.value })}
                      className="border rounded px-2 py-1 nikud-text"
                    />
                  </label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{strings.inbox.colType}</span>
                      <select
                        value={row.item_type}
                        onChange={(e) => updateRow(i, { item_type: e.target.value as Row["item_type"] })}
                        className="border rounded px-2 py-1"
                      >
                        {(Object.keys(typeLabels) as Row["item_type"][]).map((t) => (
                          <option key={t} value={t}>
                            {typeLabels[t]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="text-sm text-gray-500">
                      {strings.inbox.colConfidence}:{" "}
                      {row.confidence === "low" ? strings.inbox.confidenceLow : strings.inbox.confidenceHigh}
                    </span>
                    {row.recording_id && (
                      <button
                        onClick={() => playLinkedRecording(row.recording_id!)}
                        className="text-sm text-blue-700 underline"
                      >
                        🔊 {strings.inbox.linkedRecording}
                      </button>
                    )}
                    <button onClick={() => deleteRow(i)} className="text-sm text-red-600 ms-auto">
                      {strings.inbox.deleteRow}
                    </button>
                  </div>
                  {row.duplicate_of && (
                    <p className="text-sm text-orange-700">
                      {strings.inbox.duplicateWarning}: {row.duplicate_of.translit_nikud} —{" "}
                      {row.duplicate_of.hebrew_meaning}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        )}
        <button onClick={addRow} className="self-start text-sm underline text-gray-600">
          {strings.inbox.addRow}
        </button>
      </div>

      {uncommittedCount > 0 && (
        <button
          onClick={commit}
          disabled={committing}
          className="bg-green-700 text-white rounded px-4 py-3 font-bold disabled:opacity-50"
        >
          {committing
            ? strings.inbox.committing
            : rows.some((r) => r.committed)
              ? strings.inbox.commitRemaining
              : strings.inbox.commit}
        </button>
      )}
    </div>
  );
}
