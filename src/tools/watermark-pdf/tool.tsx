import { RangeField, Segmented, TextField } from "../base/controls";
import { loadPdfLib } from "../base/engines";
import { outputName } from "../base/files";
import { openPdf, savePdf } from "../base/pdf";
import { centeredStart, unsupportedCharacter, uprightText, visualPage } from "../base/placement";
import { defineTool, throwIfCancelled, type OptionsProps } from "../base/types";

type Color = "gray" | "red" | "blue";
type Options = { text: string; size: number; opacity: number; angle: "diagonal" | "flat"; color: Color };

const COLORS: Record<Color, [number, number, number]> = {
  gray: [0.45, 0.47, 0.5],
  red: [0.8, 0.12, 0.1],
  blue: [0.1, 0.3, 0.75],
};

function WatermarkOptions({ options, setOptions }: OptionsProps<Options>) {
  return (
    <>
      <TextField label="Watermark text" value={options.text} onChange={(text) => setOptions({ ...options, text })} />
      <RangeField
        label="Size"
        value={options.size}
        min={20}
        max={140}
        step={4}
        format={(size) => `${size} pt`}
        onChange={(size) => setOptions({ ...options, size })}
      />
      <RangeField
        label="Opacity"
        value={options.opacity}
        min={10}
        max={80}
        step={5}
        format={(opacity) => `${opacity}%`}
        onChange={(opacity) => setOptions({ ...options, opacity })}
      />
      <Segmented
        label="Direction"
        value={options.angle}
        choices={[
          { value: "diagonal", label: "Diagonal" },
          { value: "flat", label: "Horizontal" },
        ]}
        onChange={(angle) => setOptions({ ...options, angle })}
      />
      <Segmented
        label="Color"
        value={options.color}
        choices={[
          { value: "gray", label: "Gray" },
          { value: "red", label: "Red" },
          { value: "blue", label: "Blue" },
        ]}
        onChange={(color) => setOptions({ ...options, color })}
      />
    </>
  );
}

export default defineTool<Options>({
  defaults: { text: "CONFIDENTIAL", size: 72, opacity: 25, angle: "diagonal", color: "gray" },
  Options: WatermarkOptions,
  actionLabel: () => "Add watermark",

  async validate(_files, options) {
    if (!options.text.trim()) return "Enter the watermark text.";
    const { PDFDocument, StandardFonts } = await loadPdfLib();
    const font = await (await PDFDocument.create()).embedFont(StandardFonts.HelveticaBold);
    const character = unsupportedCharacter(font, options.text);
    return character ? `"${character}" can't be used yet. Watermarks support Latin letters, numbers and symbols.` : null;
  },

  async run(files, options, { progress, signal }) {
    const { StandardFonts, degrees, rgb } = await loadPdfLib();
    const doc = await openPdf(files[0]);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const text = options.text.trim();
    const pages = doc.getPages();

    for (const [index, page] of pages.entries()) {
      throwIfCancelled(signal);
      const view = visualPage(page);
      const angle = options.angle === "diagonal" ? (Math.atan2(view.height, view.width) * 180) / Math.PI : 0;
      // Shrink long text so it always fits across the page.
      const fits = (view.width * 0.9) / font.widthOfTextAtSize(text, 1);
      const size = Math.min(options.size, fits * (angle ? 1.15 : 1));
      const start = centeredStart({ text, font, size }, view.width / 2, view.height / 2, angle);
      const placed = uprightText(view, start.x, start.y, angle);
      page.drawText(text, {
        x: placed.x,
        y: placed.y,
        rotate: degrees(placed.rotate),
        size,
        font,
        color: rgb(...COLORS[options.color]),
        opacity: options.opacity / 100,
      });
      progress(index + 1, pages.length);
    }

    return [{ name: outputName(files[0].file.name, "-watermarked", "pdf"), blob: await savePdf(doc) }];
  },
});
