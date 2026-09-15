import { NumberField, Segmented, Toggle } from "../base/controls";
import { loadPdfLib } from "../base/engines";
import { outputName } from "../base/files";
import { openPdf, savePdf } from "../base/pdf";
import { uprightText, visualPage } from "../base/placement";
import { defineTool, throwIfCancelled, type OptionsProps } from "../base/types";

type Options = {
  vertical: "bottom" | "top";
  horizontal: "left" | "center" | "right";
  format: "number" | "page" | "page-of" | "slash";
  start: number;
  skipFirst: boolean;
};

const MARGIN = 28;
const SIZE = 11;

function label(format: Options["format"], number: number, total: number): string {
  switch (format) {
    case "page":
      return `Page ${number}`;
    case "page-of":
      return `Page ${number} of ${total}`;
    case "slash":
      return `${number} / ${total}`;
    default:
      return String(number);
  }
}

function NumberOptions({ options, setOptions }: OptionsProps<Options>) {
  return (
    <>
      <Segmented
        label="Position"
        value={options.vertical}
        choices={[
          { value: "bottom", label: "Bottom" },
          { value: "top", label: "Top" },
        ]}
        onChange={(vertical) => setOptions({ ...options, vertical })}
      />
      <Segmented
        label="Alignment"
        value={options.horizontal}
        choices={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ]}
        onChange={(horizontal) => setOptions({ ...options, horizontal })}
      />
      <Segmented
        label="Style"
        value={options.format}
        choices={[
          { value: "number", label: "1" },
          { value: "page", label: "Page 1" },
          { value: "page-of", label: "Page 1 of 9" },
          { value: "slash", label: "1 / 9" },
        ]}
        onChange={(format) => setOptions({ ...options, format })}
      />
      <NumberField label="First number" value={options.start} min={0} onChange={(start) => setOptions({ ...options, start })} />
      <Toggle
        label="Leave the first page unnumbered"
        checked={options.skipFirst}
        hint="Useful for a cover page. Numbering still starts from the first number above."
        onChange={(skipFirst) => setOptions({ ...options, skipFirst })}
      />
    </>
  );
}

export default defineTool<Options>({
  defaults: { vertical: "bottom", horizontal: "center", format: "number", start: 1, skipFirst: false },
  Options: NumberOptions,
  actionLabel: () => "Add page numbers",
  validate: (_files, options) => (Number.isInteger(options.start) && options.start >= 0 ? null : "Enter a whole number to start from."),

  async run(files, options, { progress, signal }) {
    const { StandardFonts, degrees, rgb } = await loadPdfLib();
    const doc = await openPdf(files[0]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const numbered = options.skipFirst ? pages.length - 1 : pages.length;
    const total = options.start + numbered - 1;

    for (const [index, page] of pages.entries()) {
      throwIfCancelled(signal);
      if (options.skipFirst && index === 0) continue;
      const number = options.start + index - (options.skipFirst ? 1 : 0);
      const text = label(options.format, number, total);

      const view = visualPage(page);
      const width = font.widthOfTextAtSize(text, SIZE);
      const x =
        options.horizontal === "left" ? MARGIN : options.horizontal === "right" ? view.width - MARGIN - width : (view.width - width) / 2;
      const y = options.vertical === "bottom" ? MARGIN : view.height - MARGIN - SIZE;
      const placed = uprightText(view, x, y);
      page.drawText(text, {
        x: placed.x,
        y: placed.y,
        rotate: degrees(placed.rotate),
        size: SIZE,
        font,
        color: rgb(0.2, 0.21, 0.24),
      });
      progress(index + 1, pages.length);
    }

    return [{ name: outputName(files[0].file.name, "-numbered", "pdf"), blob: await savePdf(doc) }];
  },
});
