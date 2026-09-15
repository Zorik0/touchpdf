"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useState } from "react";
import type { ToolFile } from "./files";
import { openPdfView } from "./pdf";

export type PageSize = { width: number; height: number };

type State = { pdf: PDFDocumentProxy; sizes: PageSize[] } | { error: string } | null;

/**
 * Opens a PDF once for an interactive workspace and reads every page's size as
 * displayed (after the page's own rotation), so layouts can reserve space
 * before any page is rendered.
 */
export function usePdfDocument(toolFile: ToolFile | undefined) {
  const [state, setState] = useState<{ file: ToolFile; value: State } | null>(null);

  useEffect(() => {
    if (!toolFile) return;
    let pdf: PDFDocumentProxy | undefined;
    let cancelled = false;

    (async () => {
      try {
        pdf = await openPdfView(toolFile);
        const sizes: PageSize[] = [];
        for (let number = 1; number <= pdf.numPages; number++) {
          const viewport = (await pdf.getPage(number)).getViewport({ scale: 1 });
          sizes.push({ width: viewport.width, height: viewport.height });
        }
        if (!cancelled) setState({ file: toolFile, value: { pdf, sizes } });
      } catch (error) {
        if (!cancelled) setState({ file: toolFile, value: { error: error instanceof Error ? error.message : String(error) } });
      }
    })();

    return () => {
      cancelled = true;
      void pdf?.loadingTask.destroy();
    };
  }, [toolFile]);

  // Ignore a document that was opened for a previous file.
  return state && state.file === toolFile ? state.value : null;
}
