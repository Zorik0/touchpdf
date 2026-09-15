// PDF engines are large, so they load only when a tool first needs them.

let pdfjs: Promise<typeof import("pdfjs-dist")> | undefined;

/** pdf.js, for reading and rendering pages. Its worker is copied to public/ on install. */
export function loadPdfJs() {
  pdfjs ??= import("pdfjs-dist").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return lib;
  });
  return pdfjs;
}

/** pdf-lib (the maintained @cantoo fork, which adds encryption), for writing PDFs. */
export function loadPdfLib() {
  return import("@cantoo/pdf-lib");
}

export async function loadZip() {
  return (await import("jszip")).default;
}
