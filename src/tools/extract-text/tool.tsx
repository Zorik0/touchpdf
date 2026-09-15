import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { Toggle } from "../base/controls";
import { outputName } from "../base/files";
import { openPdfView } from "../base/pdf";
import { defineTool, throwIfCancelled, type OptionsProps } from "../base/types";

type Options = { pageHeadings: boolean };

type Line = { y: number; parts: TextItem[] };

/** Groups positioned text into lines, top to bottom, and joins each line left to right. */
function linesOf(items: TextItem[]): string[] {
  const lines: Line[] = [];
  const sorted = items
    .filter((item) => item.str.trim())
    .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);

  for (const item of sorted) {
    const height = item.height || Math.abs(item.transform[3]) || 10;
    const line = lines.find((candidate) => Math.abs(candidate.y - item.transform[5]) <= Math.max(2, height * 0.5));
    if (line) line.parts.push(item);
    else lines.push({ y: item.transform[5], parts: [item] });
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map(({ parts }) => {
      parts.sort((a, b) => a.transform[4] - b.transform[4]);
      let text = "";
      let end: number | null = null;
      for (const part of parts) {
        const gap = end === null ? 0 : part.transform[4] - end;
        if (end !== null && gap > Math.max(1, (part.height || 10) * 0.25) && !text.endsWith(" ")) text += " ";
        text += part.str;
        end = part.transform[4] + part.width;
      }
      return text.trim();
    });
}

function TextOptions({ options, setOptions }: OptionsProps<Options>) {
  return (
    <Toggle
      label="Mark where each page starts"
      checked={options.pageHeadings}
      onChange={(pageHeadings) => setOptions({ pageHeadings })}
    />
  );
}

export default defineTool<Options>({
  defaults: { pageHeadings: true },
  Options: TextOptions,
  actionLabel: () => "Extract text",

  async run(files, options, { progress, signal }) {
    const pdf = await openPdfView(files[0]);
    try {
      const pages: string[] = [];
      let found = false;
      for (let number = 1; number <= pdf.numPages; number++) {
        throwIfCancelled(signal);
        const page = await pdf.getPage(number);
        const content = await page.getTextContent();
        const lines = linesOf(content.items.filter((item): item is TextItem => "str" in item));
        found ||= lines.length > 0;
        pages.push((options.pageHeadings ? `--- Page ${number} ---\n` : "") + lines.join("\n"));
        page.cleanup();
        progress(number, pdf.numPages);
      }
      if (!found) {
        throw new Error("This PDF has no selectable text. It's probably a scan, which needs text recognition (OCR).");
      }
      const blob = new Blob([pages.join("\n\n") + "\n"], { type: "text/plain;charset=utf-8" });
      return [{ name: outputName(files[0].file.name, "", "txt"), blob }];
    } finally {
      await pdf.loadingTask.destroy();
    }
  },
});
