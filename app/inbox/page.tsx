"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { strings } from "@/lib/strings";
import { config } from "@/lib/config";
import {
  unzipChatExport,
  parseChatText,
  distinctSenders,
  isVoiceNoteFilename,
  findMissingAudioRefs,
  type ChatMessage,
} from "@/lib/whatsapp";
import { uploadAndTranscribeRecording } from "@/lib/recording-upload";
import { resetFFmpeg } from "@/lib/transcode";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { FileDropZone } from "@/components/FileDropZone";
import {
  emptyBatchRow,
  findItemNumberGaps,
  pdfPageIndexesToProcess,
  type BatchRow,
  type BatchSummary,
  type PdfPageStatus,
  type RawInput,
} from "@/lib/batches";
import { getPdfPageCount, renderPdfPagesToImages } from "@/lib/pdf";

type Row = BatchRow;
type Lesson = { id: string; date: string; title: string | null };

type ConfidenceFilter = "all" | "high" | "low";

const typeLabels: Record<Row["item_type"], string> = {
  word: strings.inbox.typeWord,
  phrase: strings.inbox.typePhrase,
  sentence: strings.inbox.typeSentence,
};

const pdfPageStatusLabels: Record<PdfPageStatus | "processing", string> = {
  pending: strings.inbox.pdfStatusPending,
  processing: strings.inbox.pdfStatusProcessing,
  done: strings.inbox.pdfStatusDone,
  failed: strings.inbox.pdfStatusFailed,
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

function rowsToCsv(rows: Row[]): string {
  const headers = ["item_number", "item_type", "translit_nikud", "hebrew_meaning", "arabic_script", "notes", "confidence", "page_number", "committed"];
  const escape = (v: string | number | boolean | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const dataRows = rows.map((r) =>
    headers.map((h) => escape((r as Record<string, unknown>)[h] as string)).join(",")
  );
  return [headers.join(","), ...dataRows].join("\n");
}

function downloadCsv(rows: Row[], filename: string) {
  const csv = rowsToCsv(rows);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [showReferenceRows, setShowReferenceRows] = useState(false);

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
  const [pdfPages, setPdfPages] = useState<{ pageNumber: number; status: PdfPageStatus | "processing" }[]>([]);

  const [zipFile, setZipFile] = useState<File | null>(null);
  const [waStep, setWaStep] = useState<"pick-zip" | "pick-teacher" | "processing">("pick-zip");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mediaFiles, setMediaFiles] = useState<Map<string, File>>(new Map());
  const [senders, setSenders] = useState<string[]>([]);
  const [teacherSender, setTeacherSender] = useState("");
  const [waStatus, setWaStatus] = useState<string | null>(null);
  const [waMissingAudio, setWaMissingAudio] = useState<string[]>([]);
  const [waSummary, setWaSummary] = useState<{ recordings: number; deduped: number; errors: { filename: string; error: string }[] } | null>(null);
  const [waCursor, setWaCursor] = useState<Date | null>(null);
  const [waImportAll, setWaImportAll] = useState(false);
  const [waPendingCursor, setWaPendingCursor] = useState<{ chatIdentifier: string; lastImportedAt: string } | null>(
    null
  );

  // Component-level ref always mirrors rows state — so processPdfPage always
  // sees the latest user edits/deletes rather than a stale snapshot from when
  // the run started. Fixes the resurrection bug where deleted rows reappeared
  // when the next page finished.
  const rowsRef = useRef<Row[]>([]);
  const currentBatchIdRef = useRef<string | null>(null);
  const savePendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Keep rowsRef and state in sync.
  function setRowsAndRef(newRows: Row[]) {
    rowsRef.current = newRows;
    setRows(newRows);
  }

  // Persist current rows to batch after a short debounce. Safe to call
  // frequently; only fires if a batch is open.
  const scheduleBatchSave = useCallback((updatedRows: Row[]) => {
    const batchId = currentBatchIdRef.current;
    if (!batchId) return;
    if (savePendingRef.current) clearTimeout(savePendingRef.current);
    savePendingRef.current = setTimeout(() => {
      fetch(`/api/inbox/batches/${batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed_rows: updatedRows }),
      });
    }, 800);
  }, []);

  useEffect(() => {
    currentBatchIdRef.current = currentBatchId;
  }, [currentBatchId]);

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
    setRowsAndRef(batch.parsed_rows ?? []);
    setLessonId(batch.lesson_id ?? "");
    setCommitted(false);
    setShowBatchList(false);
    setGapWarning(batch.source === "pdf" ? gapWarningText(batch.parsed_rows ?? []) : null);

    if (batch.source === "pdf") {
      const rawInput = batch.raw_input as RawInput & { source: "pdf" };
      const pageStatus: PdfPageStatus[] =
        rawInput.page_status ?? rawInput.page_image_paths.map(() => "done" as const);
      setPdfPages(
        rawInput.page_image_paths.map((_, i) => ({
          pageNumber: rawInput.page_range.from + i,
          status: pageStatus[i] ?? "pending",
        }))
      );
    } else {
      setPdfPages([]);
    }
  }

  async function downloadBatchCsv(id: string, source: BatchSummary["source"]) {
    const { batch } = await fetch(`/api/inbox/batches/${id}`).then((r) => r.json());
    downloadCsv(batch.parsed_rows ?? [], `batch-${source}-${id.slice(0, 8)}.csv`);
  }

  // Extracts one PDF page image, appends its rows into the running batch
  // state, and immediately persists both the rows and the page's status.
  // Uses component-level rowsRef so user edits/deletes made mid-run are
  // preserved and never overwritten by incoming page results.
  async function processPdfPage(
    batchId: string,
    pageIndex: number,
    pageNumber: number,
    getBase64: () => Promise<string>,
    statusRef: { current: PdfPageStatus[] },
    rawInput: RawInput & { source: "pdf" }
  ) {
    setPdfPages((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, status: "processing" } : p)));

    try {
      const base64 = await getBase64();
      const res = await fetch("/api/inbox/pdf-extract-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType: "image/png" }),
      }).then((r) => r.json());
      if (res.error) throw new Error(res.error);

      const newRows: Row[] = (res.items ?? []).map((it: Partial<Row>) => ({
        ...emptyBatchRow(),
        ...it,
        // low-confidence rows start unapproved; high-confidence start approved
        approved: (it.confidence ?? "high") === "high",
        page_number: pageNumber,
      }));
      // Merge: keep all rows NOT from this page (including user edits/deletes
      // on other pages) and replace this page's rows with fresh results.
      rowsRef.current = [...rowsRef.current.filter((r) => r.page_number !== pageNumber), ...newRows];
      statusRef.current = statusRef.current.map((s, i) => (i === pageIndex ? "done" : s));
    } catch {
      statusRef.current = statusRef.current.map((s, i) => (i === pageIndex ? "failed" : s));
    }

    setRows([...rowsRef.current]);
    setGapWarning(gapWarningText(rowsRef.current));
    setPdfPages((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, status: statusRef.current[pageIndex] } : p)));

    await fetch(`/api/inbox/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parsed_rows: rowsRef.current,
        raw_input: { ...rawInput, page_status: statusRef.current },
      }),
    });
    loadBatches();
  }

  async function runPdfBatch(batchId: string, mode: "all" | "resume", onlyPageIndex?: number) {
    setReparsing(true);
    try {
      const { batch } = await fetch(`/api/inbox/batches/${batchId}`).then((r) => r.json());
      const rawInput = batch.raw_input as RawInput & { source: "pdf" };
      const existingStatus: PdfPageStatus[] =
        rawInput.page_status ?? rawInput.page_image_paths.map(() => "done" as const);
      const statusRef = { current: [...existingStatus] };

      setCurrentBatchId(batchId);
      setCurrentBatchSource("pdf");
      setLessonId(batch.lesson_id ?? "");
      setCommitted(false);
      setShowBatchList(false);
      // Initialize the component-level rowsRef from server state
      rowsRef.current = batch.parsed_rows ?? [];
      setRows([...rowsRef.current]);
      setGapWarning(gapWarningText(rowsRef.current));
      setPdfPages(
        rawInput.page_image_paths.map((_, i) => ({
          pageNumber: rawInput.page_range.from + i,
          status: statusRef.current[i] ?? "pending",
        }))
      );

      const indexes =
        onlyPageIndex !== undefined ? [onlyPageIndex] : pdfPageIndexesToProcess(statusRef.current, mode);

      for (let n = 0; n < indexes.length; n++) {
        const i = indexes[n];
        const pageNumber = rawInput.page_range.from + i;
        setPdfStatus(`${strings.inbox.pdfExtracting} (${n + 1}/${indexes.length})`);
        await processPdfPage(
          batchId,
          i,
          pageNumber,
          async () => {
            const { url } = await fetch(
              `/api/inbox/imports-url?path=${encodeURIComponent(rawInput.page_image_paths[i])}`
            ).then((r) => r.json());
            const blob = await fetch(url).then((r) => r.blob());
            return blobToBase64(blob);
          },
          statusRef,
          rawInput
        );
      }
    } finally {
      setPdfStatus(null);
      setReparsing(false);
      loadBatches();
    }
  }

  async function reparseCurrentBatch() {
    if (!currentBatchId) return;
    if (currentBatchSource === "pdf") return runPdfBatch(currentBatchId, "all");

    setReparsing(true);
    try {
      const { rows: newRows } = await fetch(`/api/inbox/batches/${currentBatchId}/reparse`, {
        method: "POST",
      }).then((r) => r.json());
      const committedRows = rows.filter((r) => r.committed);
      setRowsAndRef([...committedRows, ...(newRows ?? [])]);
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
    setRowsAndRef(parsedRows);
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
    setRowsAndRef(parsedRows);
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
      setWaMissingAudio(findMissingAudioRefs(messages, media));
      setWaSummary(null);
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
      .map((m) => ({ timestamp: m.timestamp, filename: m.attachmentFilename!, file: mediaFiles.get(m.attachmentFilename!) }))
      .filter((v): v is { timestamp: Date; filename: string; file: File } => !!v.file);

    const uploadedRecordings: { id: string; timestamp: Date }[] = [];
    let dedupedCount = 0;
    const uploadErrors: { filename: string; error: string }[] = [];
    const UPLOAD_TIMEOUT_MS = 90_000;

    for (let i = 0; i < voiceNoteEntries.length; i++) {
      const { file, filename, timestamp } = voiceNoteEntries[i];
      const n = `${i + 1}/${voiceNoteEntries.length}`;
      setWaStatus(`${strings.inbox.whatsappUploadingVoiceNotes} (${n})`);

      try {
        const uploadPromise = uploadAndTranscribeRecording(file, {
          lessonId: lessonId || null,
          maxAutoTranscribeDurationSec: config.autoTranscribeMaxDurationSec,
          autoTag: { maxDurationSec: config.dailyProverbMaxDurationSec, tag: config.dailyProverbTag },
          sourceFilename: filename,
          onStatus: (step) => {
            const label = step === "transcoding" ? "המרה" : step === "uploading" ? "העלאה" : "תמלול";
            setWaStatus(`${label} (${n}): ${filename}`);
          },
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`timeout after ${UPLOAD_TIMEOUT_MS / 1000}s`)), UPLOAD_TIMEOUT_MS)
        );
        const { id, deduplicated } = await Promise.race([uploadPromise, timeoutPromise]);
        if (deduplicated) dedupedCount++;
        uploadedRecordings.push({ id, timestamp });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[upload] ${filename}: ${msg}`);
        uploadErrors.push({ filename, error: msg });
        // Reset FFmpeg singleton so a hung/failed transcode doesn't block the next file
        resetFFmpeg();
      }
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

    setRowsAndRef(withRecording);
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
    setWaSummary({ recordings: uploadedRecordings.length, deduped: dedupedCount, errors: uploadErrors });
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
    for (const { pageNumber, blob } of pages) {
      const file = new File([blob], `page-${pageNumber}.png`, { type: "image/png" });
      pageImagePaths.push(await uploadToImports(file));
    }

    const initialStatus: PdfPageStatus[] = pages.map(() => "pending");
    const rawInput: RawInput & { source: "pdf" } = {
      source: "pdf",
      page_image_paths: pageImagePaths,
      page_range: { from: pdfFromPage, to: pdfToPage },
      page_status: initialStatus,
    };

    const batch = await createBatch("pdf", lessonId, rawInput, []);
    setCurrentBatchId(batch.id);
    setCurrentBatchSource("pdf");
    // Initialize component-level rowsRef for this new run
    rowsRef.current = [];
    setRows([]);
    setGapWarning(null);
    setPdfPages(pages.map((p) => ({ pageNumber: p.pageNumber, status: "pending" as const })));
    loadBatches();

    const statusRef = { current: [...initialStatus] };

    for (let i = 0; i < pages.length; i++) {
      setPdfStatus(`${strings.inbox.pdfExtracting} (${i + 1}/${pages.length})`);
      const { blob } = pages[i];
      await processPdfPage(
        batch.id,
        i,
        pages[i].pageNumber,
        () => blobToBase64(blob),
        statusRef,
        rawInput
      );
    }

    setPdfStatus(null);
    loadBatches();
  }

  function retryPdfPage(pageIndex: number) {
    if (!currentBatchId) return;
    return runPdfBatch(currentBatchId, "resume", pageIndex);
  }

  function resumeBatchFromList(id: string) {
    return runPdfBatch(id, "resume");
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
    setRows((prev) => {
      const next = prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
      rowsRef.current = next;
      scheduleBatchSave(next);
      return next;
    });
  }

  function deleteRow(i: number) {
    setRows((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      rowsRef.current = next;
      // Persist delete immediately (no debounce)
      const batchId = currentBatchIdRef.current;
      if (batchId) {
        fetch(`/api/inbox/batches/${batchId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parsed_rows: next }),
        });
      }
      return next;
    });
  }

  function addRow() {
    setRows((prev) => {
      const next = [...prev, emptyBatchRow()];
      rowsRef.current = next;
      return next;
    });
  }

  async function commit() {
    // Reference rows are never committed; low-confidence rows must be approved.
    const toCommit = rows.filter(
      (r) => !r.committed && r.page_kind !== "reference" && (r.confidence === "high" || r.approved)
    );
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
        batch_id: currentBatchId || null,
      }),
    }).then((r) => r.json());

    let cardIdx = 0;
    const committedIds = new Set(toCommit.map((r) => r.row_id));
    const updatedRows = rows.map((r) =>
      committedIds.has(r.row_id)
        ? { ...r, committed: true, card_id: cards?.[cardIdx++]?.id ?? null }
        : r
    );
    setRowsAndRef(updatedRows);

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

  const hasReferenceRows = rows.some((r) => r.page_kind === "reference");

  const visibleRows = rows.filter((r) => {
    if (r.page_kind === "reference" && !showReferenceRows) return false;
    if (confidenceFilter === "high" && r.confidence !== "high") return false;
    if (confidenceFilter === "low" && r.confidence !== "low") return false;
    return true;
  });

  // Committable = not yet committed, not reference, and either high confidence or approved
  const uncommittedCount = rows.filter(
    (r) => !r.committed && r.page_kind !== "reference" && (r.confidence === "high" || r.approved)
  ).length;

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
                  {b.has_incomplete_pdf_pages && (
                    <span className="text-orange-600"> · {strings.inbox.pdfIncompleteBadge}</span>
                  )}
                </span>
                <span className="flex gap-3">
                  {b.has_incomplete_pdf_pages && (
                    <button onClick={() => resumeBatchFromList(b.id)} className="text-orange-700 underline">
                      {strings.inbox.pdfResume}
                    </button>
                  )}
                  <button onClick={() => downloadBatchCsv(b.id, b.source)} className="text-gray-600 underline">
                    {strings.inbox.exportCsv}
                  </button>
                  <button onClick={() => reopenBatch(b.id)} className="text-blue-700 underline">
                    {strings.inbox.batchReopen}
                  </button>
                </span>
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
          <FileDropZone
            accept="image/*"
            multiple
            value={files}
            onChange={setFiles}
            hint="תמונות JPG, PNG וכד׳"
          />
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
          {waSummary && (
            <div className={`rounded-lg border px-4 py-3 text-sm flex flex-col gap-1 ${waSummary.errors.length > 0 ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 text-orange-800 dark:text-orange-300" : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 text-green-800 dark:text-green-300"}`}>
              <span className="font-medium">ייבוא הסתיים</span>
              <span>
                הקלטות: {waSummary.recordings - waSummary.deduped} חדשות
                {waSummary.deduped > 0 && `, ${waSummary.deduped} כבר קיימות (דולגו)`}
                {waSummary.errors.length > 0 && `, ${waSummary.errors.length} נכשלו`}
              </span>
              {waSummary.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs opacity-80">פרטי שגיאות</summary>
                  <ul className="mt-1 space-y-0.5 text-xs opacity-80 font-mono">
                    {waSummary.errors.map((e, i) => (
                      <li key={i}>{e.filename}: {e.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          {waStep === "pick-zip" && (
            <>
              <FileDropZone
                accept=".zip"
                value={zipFile ? [zipFile] : []}
                onChange={(fs) => { setZipFile(fs[0] ?? null); setWaMissingAudio([]); setWaSummary(null); }}
                hint="קובץ ZIP של ייצוא שיחת וואטסאפ"
              />
              <button
                onClick={handleUnzip}
                disabled={!zipFile || waStatus !== null}
                className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50"
              >
                {waStatus ?? strings.inbox.whatsappUnzip}
              </button>
              {waMissingAudio.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 px-4 py-3 text-sm text-orange-800 dark:text-orange-300">
                  <span className="font-medium">⚠ השיחה מכילה {waMissingAudio.length} הקלטות שאינן בקובץ ה-ZIP</span>
                  <p className="mt-1 text-xs opacity-80">ייצא שוב את השיחה עם מדיה (Media) מוואטסאפ</p>
                </div>
              )}
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
          <FileDropZone
            accept="application/pdf"
            value={pdfFile ? [pdfFile] : []}
            onChange={(fs) => handlePdfFileChange(fs[0] ?? null)}
            hint="קובץ PDF"
          />
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

          {pdfPages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pdfPages.map((p, i) => (
                <span
                  key={p.pageNumber}
                  className={
                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs " +
                    (p.status === "done"
                      ? "bg-green-100 text-green-800"
                      : p.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : p.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600")
                  }
                >
                  {p.pageNumber}: {pdfPageStatusLabels[p.status]}
                  {p.status === "failed" && (
                    <button onClick={() => retryPdfPage(i)} className="underline">
                      {strings.inbox.pdfRetryPage}
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {gapWarning && (
        <p className="text-orange-700 bg-orange-50 border border-orange-400 rounded p-3 text-sm">{gapWarning}</p>
      )}

      {committed && <p className="text-green-700">{strings.inbox.committed}</p>}

      <audio ref={previewAudioRef} className="hidden" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold">{strings.inbox.tableTitle}</h2>
          <span className="flex gap-3 items-center flex-wrap">
            {/* Confidence filter */}
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value as ConfidenceFilter)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">{strings.inbox.confidenceFilterAll}</option>
              <option value="high">{strings.inbox.confidenceFilterHigh}</option>
              <option value="low">{strings.inbox.confidenceFilterLow}</option>
            </select>
            {/* Reference rows toggle */}
            {hasReferenceRows && (
              <button
                onClick={() => setShowReferenceRows((v) => !v)}
                className="text-sm underline text-gray-600"
              >
                {showReferenceRows ? strings.inbox.hideReferenceRows : strings.inbox.showReferenceRows}
              </button>
            )}
            {/* Export CSV for current batch */}
            {currentBatchId && (
              <button
                onClick={() => downloadCsv(rows, `batch-${currentBatchId.slice(0, 8)}.csv`)}
                className="text-sm underline text-gray-600"
              >
                {strings.inbox.exportCsv}
              </button>
            )}
            {currentBatchId && (
              <span className="flex gap-3">
                {currentBatchSource === "pdf" && pdfPages.some((p) => p.status !== "done") && (
                  <button
                    onClick={() => runPdfBatch(currentBatchId, "resume")}
                    disabled={reparsing}
                    className="text-sm underline text-orange-700 disabled:opacity-50"
                  >
                    {reparsing ? strings.inbox.batchReparsing : strings.inbox.pdfResume}
                  </button>
                )}
                <button
                  onClick={reparseCurrentBatch}
                  disabled={reparsing}
                  className="text-sm underline text-blue-700 disabled:opacity-50"
                >
                  {reparsing ? strings.inbox.batchReparsing : strings.inbox.batchReparse}
                </button>
              </span>
            )}
          </span>
        </div>
        {visibleRows.length === 0 ? (
          <p className="text-gray-500">{strings.inbox.emptyState}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleRows.map((row) => {
              // Find index in original rows array (for updateRow/deleteRow)
              const i = rows.indexOf(row);
              return row.committed ? (
                <div key={row.row_id} className="flex items-center gap-2 border rounded p-3 bg-gray-50 text-gray-500">
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                    {strings.inbox.committedBadge}
                  </span>
                  <span className="nikud-text">{row.translit_nikud}</span>
                  <span>—</span>
                  <span className="nikud-text">{row.hebrew_meaning}</span>
                </div>
              ) : (
                <div
                  key={row.row_id}
                  className={`flex flex-col gap-2 border rounded p-3 ${
                    row.page_kind === "reference"
                      ? "border-gray-300 bg-gray-50 opacity-70"
                      : row.confidence === "low"
                        ? "border-orange-400 bg-orange-50"
                        : ""
                  }`}
                >
                  {row.page_kind === "reference" && (
                    <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 self-start">
                      {strings.inbox.referenceRowBadge}
                    </span>
                  )}
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
                    {/* Low-confidence rows require explicit approval before commit */}
                    {row.confidence === "low" && row.page_kind !== "reference" && (
                      <label className="flex items-center gap-1 text-sm text-orange-800">
                        <input
                          type="checkbox"
                          checked={row.approved}
                          onChange={(e) => updateRow(i, { approved: e.target.checked })}
                        />
                        {strings.inbox.colApprove}
                      </label>
                    )}
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
              );
            })}
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
