import { NumberField, Segmented, TextField } from "../base/controls";
import { loadPdfLib } from "../base/engines";
import { baseName } from "../base/files";
import { countPages, openPdf, savePdf } from "../base/pdf";
import { parsePageList } from "../base/pages";
import { defineTool, throwIfCancelled, type OptionsProps } from "../base/types";

type Mode = "select" | "ranges" | "every-page" | "chunks";
type Options = { mode: Mode; pages: string; ranges: string; chunkSize: number };

const MODES: { value: Mode; label: string }[] = [
  { value: "select", label: "Pick pages" },
  { value: "ranges", label: "Ranges" },
  { value: "every-page", label: "Every page" },
  { value: "chunks", label: "Every N pages" },
];

function SplitOptions({ options, setOptions }: OptionsProps<Options>) {
  return (
    <>
      <Segmented label="How to split" value={options.mode} choices={MODES} onChange={(mode) => setOptions({ ...options, mode })} />
      {options.mode === "select" && (
        <TextField
          label="Pages to keep"
          value={options.pages}
          placeholder="1-3, 5, 8-"
          hint="They're saved together as one PDF, in this order."
          onChange={(pages) => setOptions({ ...options, pages })}
        />
      )}
      {options.mode === "ranges" && (
        <TextField
          label="Page ranges"
          value={options.ranges}
          placeholder="1-3, 4-6, 7-"
          hint="Each range becomes its own PDF."
          onChange={(ranges) => setOptions({ ...options, ranges })}
        />
      )}
      {options.mode === "chunks" && (
        <NumberField
          label="Pages per file"
          value={options.chunkSize}
          min={1}
          onChange={(chunkSize) => setOptions({ ...options, chunkSize })}
        />
      )}
    </>
  );
}

/** Turns the chosen mode into groups of zero-based page indexes, one group per output file. */
function groupsFor(options: Options, pageCount: number): { groups: number[][] } | { error: string } {
  const all = Array.from({ length: pageCount }, (_, index) => index);
  switch (options.mode) {
    case "select": {
      if (!options.pages.trim()) return { error: `Enter the pages to keep, out of ${pageCount}.` };
      const result = parsePageList(options.pages, pageCount);
      return result.error ? { error: result.error } : { groups: [result.pages!] };
    }
    case "ranges": {
      const groups: number[][] = [];
      for (const range of options.ranges.split(",").filter((part) => part.trim())) {
        const result = parsePageList(range, pageCount);
        if (result.error) return { error: result.error };
        groups.push(result.pages!);
      }
      return groups.length ? { groups } : { error: `Enter the ranges, such as 1-3, 4-${pageCount}.` };
    }
    case "every-page":
      return { groups: all.map((index) => [index]) };
    case "chunks": {
      if (!Number.isInteger(options.chunkSize) || options.chunkSize < 1) return { error: "Enter a whole number of pages." };
      const groups: number[][] = [];
      for (let start = 0; start < pageCount; start += options.chunkSize) groups.push(all.slice(start, start + options.chunkSize));
      return { groups };
    }
  }
}

function label(group: number[], index: number): string {
  const contiguous = group.every((page, i) => i === 0 || page === group[i - 1] + 1);
  if (!contiguous) return `part-${index + 1}`;
  return group.length === 1 ? `page-${group[0] + 1}` : `pages-${group[0] + 1}-${group[group.length - 1] + 1}`;
}

export default defineTool<Options>({
  defaults: { mode: "select", pages: "", ranges: "", chunkSize: 2 },
  Options: SplitOptions,

  actionLabel: (_files, options) => (options.mode === "select" ? "Extract pages" : "Split PDF"),

  async validate(files, options) {
    const result = groupsFor(options, await countPages(files[0]));
    return "error" in result ? result.error : null;
  },

  async run(files, options, { progress, signal }) {
    const { PDFDocument } = await loadPdfLib();
    const source = await openPdf(files[0]);
    const result = groupsFor(options, source.getPageCount());
    if ("error" in result) throw new Error(result.error);

    const name = baseName(files[0].file.name);
    const outputs = [];
    for (const [index, group] of result.groups.entries()) {
      throwIfCancelled(signal);
      const doc = await PDFDocument.create();
      for (const page of await doc.copyPages(source, group)) doc.addPage(page);
      const suffix = options.mode === "select" ? "extracted" : label(group, index);
      outputs.push({ name: `${name}-${suffix}.pdf`, blob: await savePdf(doc) });
      progress(index + 1, result.groups.length);
    }
    return outputs;
  },
});
