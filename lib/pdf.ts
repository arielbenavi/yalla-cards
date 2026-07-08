"use client";

const TARGET_DPI = 200;
const PDF_BASE_DPI = 72; // pdf.js viewport scale=1 == 72dpi

// pdfjs-dist references browser-only globals (DOMMatrix etc.) at module scope,
// which breaks Next's server-side prerender of this ("use client") page unless
// the import is deferred until we're actually running in the browser.
async function getPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@6.1.200/build/pdf.worker.min.mjs";
  return pdfjsLib;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjsLib = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  return pdf.numPages;
}

// Renders each page in [fromPage, toPage] (1-indexed, inclusive) to a PNG
// image client-side. We never touch the PDF's embedded text layer -- for
// this course book it's corrupted for nikkud Hebrew -- so extraction always
// goes through Gemini vision on these rendered images instead.
export async function renderPdfPagesToImages(
  file: File,
  fromPage: number,
  toPage: number,
  onProgress?: (done: number, total: number) => void
): Promise<{ pageNumber: number; blob: Blob }[]> {
  const pdfjsLib = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const scale = TARGET_DPI / PDF_BASE_DPI;
  const total = toPage - fromPage + 1;
  const results: { pageNumber: number; blob: Blob }[] = [];

  for (let pageNumber = fromPage; pageNumber <= toPage; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("could not get canvas 2d context");

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))), "image/png");
    });

    results.push({ pageNumber, blob });
    onProgress?.(pageNumber - fromPage + 1, total);
  }

  return results;
}
