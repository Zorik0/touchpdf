import type { PDFDocumentProxy } from "pdfjs-dist";

export type PageListResult = { pages: number[]; error?: undefined } | { pages?: undefined; error: string };

/**
 * Parses a page list such as "1-3, 5, 8-" into zero-based page indexes, in the
 * order written. Open ranges run to the first ("-4") or last ("8-") page.
 */
export function parsePageList(input: string, pageCount: number): PageListResult {
  const parts = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return { error: "Enter at least one page number." };

  const pages: number[] = [];
  for (const part of parts) {
    const match = /^(\d*)\s*(-)?\s*(\d*)$/.exec(part);
    if (!match || (!match[1] && !match[3])) return { error: `"${part}" isn't a page number or range.` };
    const [, startText, dash, endText] = match;
    const start = startText ? Number(startText) : 1;
    const end = dash ? (endText ? Number(endText) : pageCount) : start;
    if (start < 1 || end < 1) return { error: "Page numbers start at 1." };
    if (start > pageCount || end > pageCount) {
      return { error: `This PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.` };
    }
    const step = start <= end ? 1 : -1;
    for (let page = start; page !== end + step; page += step) pages.push(page - 1);
  }
  return { pages };
}

/** Renders one page to a canvas at the given CSS width, sharp on high-density screens. */
export async function renderPage(pdf: PDFDocumentProxy, index: number, cssWidth: number): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(index + 1);
  const unscaled = page.getViewport({ scale: 1 });
  const scale = (cssWidth / unscaled.width) * Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport }).promise;
  page.cleanup();
  return canvas;
}
