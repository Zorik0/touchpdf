// Extract positioned text from a PDF and group it into lines,
// preserving reading order. Used by the PDF → Word / Excel converters.
import { initPdfWorker } from './pdf-worker';

export interface TextFragment {
  x: number;
  y: number;
  width: number;
  height: number;
  str: string;
}

export interface TextLine {
  y: number;
  fragments: TextFragment[]; // sorted by x
}

// Returns one array of lines per page.
export async function extractPageLines(
  data: ArrayBuffer,
  onProgress?: (pct: number) => void,
): Promise<TextLine[][]> {
  const pdfjs = await initPdfWorker();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const pages: TextLine[][] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const fragments: TextFragment[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      fragments.push({
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height || Math.abs(item.transform[3]) || 10,
        str: item.str,
      });
    }

    // Group into lines: fragments whose baselines are within half a line height
    fragments.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: TextLine[] = [];
    for (const frag of fragments) {
      const tol = Math.max(2, frag.height * 0.5);
      const line = lines.find(l => Math.abs(l.y - frag.y) <= tol);
      if (line) line.fragments.push(frag);
      else lines.push({ y: frag.y, fragments: [frag] });
    }
    lines.forEach(l => l.fragments.sort((a, b) => a.x - b.x));
    lines.sort((a, b) => b.y - a.y);
    pages.push(lines);
    onProgress?.(Math.round((p / pdf.numPages) * 100));
  }
  return pages;
}

// Merge a line's fragments into a single string, inserting spaces at gaps.
export function lineToText(line: TextLine): string {
  let out = '';
  let prevEnd: number | null = null;
  for (const f of line.fragments) {
    if (prevEnd !== null && f.x - prevEnd > Math.max(1, f.height * 0.25) && !out.endsWith(' ')) {
      out += ' ';
    }
    out += f.str;
    prevEnd = f.x + f.width;
  }
  return out.trim();
}

// Split a line into table cells at larger horizontal gaps.
export function lineToCells(line: TextLine, gapThreshold = 8): string[] {
  const cells: string[] = [];
  let current = '';
  let prevEnd: number | null = null;
  for (const f of line.fragments) {
    if (prevEnd !== null && f.x - prevEnd > gapThreshold) {
      cells.push(current.trim());
      current = '';
    } else if (prevEnd !== null && f.x - prevEnd > Math.max(1, f.height * 0.25) && !current.endsWith(' ')) {
      current += ' ';
    }
    current += f.str;
    prevEnd = f.x + f.width;
  }
  if (current.trim()) cells.push(current.trim());
  return cells;
}
