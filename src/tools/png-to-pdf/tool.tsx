import { Segmented } from "../base/controls";
import { loadPdfLib } from "../base/engines";
import { outputName } from "../base/files";
import { savePdf } from "../base/pdf";
import { defineTool, throwIfCancelled, type OptionsProps } from "../base/types";

type Options = { pageSize: "fit" | "a4" | "letter"; margin: "none" | "small" | "large" };

const SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const;
const MARGINS = { none: 0, small: 24, large: 48 } as const;
/** "Same as image" pages are capped at A3 so huge photos don't become poster-sized pages. */
const MAX_FIT_SIDE = 1190;

function PageOptions({ options, setOptions }: OptionsProps<Options>) {
  return (
    <>
      <Segmented
        label="Page size"
        value={options.pageSize}
        choices={[
          { value: "fit", label: "Same as image" },
          { value: "a4", label: "A4" },
          { value: "letter", label: "Letter" },
        ]}
        onChange={(pageSize) => setOptions({ ...options, pageSize })}
      />
      <Segmented
        label="Margin"
        value={options.margin}
        choices={[
          { value: "none", label: "None" },
          { value: "small", label: "Small" },
          { value: "large", label: "Large" },
        ]}
        onChange={(margin) => setOptions({ ...options, margin })}
      />
    </>
  );
}

/** Reads the EXIF orientation of a JPEG (1 means upright). */
function jpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset);
    const length = view.getUint16(offset + 2);
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10;
      const little = view.getUint16(tiff) === 0x4949;
      const entries = view.getUint16(tiff + view.getUint32(tiff + 4, little), little);
      for (let entry = 0; entry < entries; entry++) {
        const at = tiff + view.getUint32(tiff + 4, little) + 2 + entry * 12;
        if (at + 10 > view.byteLength) break;
        if (view.getUint16(at, little) === 0x0112) return view.getUint16(at + 8, little);
      }
      return 1;
    }
    if ((marker & 0xff00) !== 0xff00) break;
    offset += 2 + length;
  }
  return 1;
}

/** Redraws an image through a canvas, applying its orientation, and returns JPEG bytes. */
async function reencode(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return new Uint8Array(await blob.arrayBuffer());
}

export default defineTool<Options>({
  defaults: { pageSize: "fit", margin: "none" },
  Options: PageOptions,
  actionLabel: (files) => (files.length === 1 ? "Convert to PDF" : `Convert ${files.length} images to PDF`),

  async run(files, options, { progress, signal }) {
    const { PDFDocument } = await loadPdfLib();
    const doc = await PDFDocument.create();
    const margin = MARGINS[options.margin];

    for (const [index, { file }] of files.entries()) {
      throwIfCancelled(signal);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;

      const image =
        isPng
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(isJpeg && jpegOrientation(bytes) === 1 ? bytes : await reencode(file));

      let pageWidth: number;
      let pageHeight: number;
      if (options.pageSize === "fit") {
        const scale = Math.min(0.75, MAX_FIT_SIDE / Math.max(image.width, image.height));
        pageWidth = image.width * scale + margin * 2;
        pageHeight = image.height * scale + margin * 2;
      } else {
        const [short, long] = SIZES[options.pageSize];
        const landscape = image.width > image.height;
        pageWidth = landscape ? long : short;
        pageHeight = landscape ? short : long;
      }

      const box = { width: pageWidth - margin * 2, height: pageHeight - margin * 2 };
      const fit = Math.min(box.width / image.width, box.height / image.height);
      const width = image.width * fit;
      const height = image.height * fit;
      doc.addPage([pageWidth, pageHeight]).drawImage(image, {
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height,
      });
      progress(index + 1, files.length);
    }

    const name = files.length === 1 ? outputName(files[0].file.name, "", "pdf") : "images.pdf";
    return [{ name, blob: await savePdf(doc) }];
  },
});
