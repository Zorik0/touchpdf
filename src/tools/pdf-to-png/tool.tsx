import { Segmented, TextField } from "../base/controls";
import { baseName } from "../base/files";
import { countPages, openPdfView } from "../base/pdf";
import { parsePageList } from "../base/pages";
import { defineTool, throwIfCancelled, type OptionsProps } from "../base/types";

type Format = "jpg" | "png";
type Options = { format: Format; dpi: "72" | "150" | "300"; which: "all" | "some"; pages: string };

/** iOS Safari refuses to draw canvases larger than this. */
const MAX_CANVAS_PIXELS = 16_000_000;

function ImageOptions({ options, setOptions }: OptionsProps<Options>) {
  return (
    <>
      <Segmented
        label="Format"
        value={options.format}
        choices={[
          { value: "jpg", label: "JPG" },
          { value: "png", label: "PNG" },
        ]}
        onChange={(format) => setOptions({ ...options, format })}
      />
      <Segmented
        label="Resolution"
        value={options.dpi}
        choices={[
          { value: "72", label: "Screen" },
          { value: "150", label: "Standard" },
          { value: "300", label: "Print" },
        ]}
        onChange={(dpi) => setOptions({ ...options, dpi })}
      />
      <Segmented
        label="Pages"
        value={options.which}
        choices={[
          { value: "all", label: "All pages" },
          { value: "some", label: "Choose pages" },
        ]}
        onChange={(which) => setOptions({ ...options, which })}
      />
      {options.which === "some" && (
        <TextField
          label="Page numbers"
          value={options.pages}
          placeholder="1, 3-5"
          onChange={(pages) => setOptions({ ...options, pages })}
        />
      )}
    </>
  );
}

async function pagesFor(options: Options, pageCount: number): Promise<number[] | string> {
  if (options.which === "all") return Array.from({ length: pageCount }, (_, index) => index);
  if (!options.pages.trim()) return `Enter the pages to convert, out of ${pageCount}.`;
  const result = parsePageList(options.pages, pageCount);
  return result.error ?? [...new Set(result.pages)];
}

export default defineTool<Options>({
  defaults: { format: "jpg", dpi: "150", which: "all", pages: "" },
  Options: ImageOptions,
  actionLabel: (_files, options) => `Convert to ${options.format.toUpperCase()}`,

  async validate(files, options) {
    const pages = await pagesFor(options, await countPages(files[0]));
    return typeof pages === "string" ? pages : null;
  },

  async run(files, options, { progress, signal }) {
    const pdf = await openPdfView(files[0]);
    try {
      const pages = await pagesFor(options, pdf.numPages);
      if (typeof pages === "string") throw new Error(pages);

      const name = baseName(files[0].file.name);
      const mime = options.format === "jpg" ? "image/jpeg" : "image/png";
      const outputs = [];

      for (const [index, pageIndex] of pages.entries()) {
        throwIfCancelled(signal);
        const page = await pdf.getPage(pageIndex + 1);
        const base = page.getViewport({ scale: 1 });
        let scale = Number(options.dpi) / 72;
        const pixels = base.width * base.height * scale * scale;
        if (pixels > MAX_CANVAS_PIXELS) scale *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvas, viewport, background: "#ffffff" }).promise;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92));
        canvas.width = canvas.height = 0;
        page.cleanup();
        if (!blob) throw new Error("This browser couldn't create the image. Try a lower resolution.");

        outputs.push({ name: `${name}-page-${pageIndex + 1}.${options.format}`, blob });
        progress(index + 1, pages.length);
      }
      return outputs;
    } finally {
      await pdf.loadingTask.destroy();
    }
  },
});
