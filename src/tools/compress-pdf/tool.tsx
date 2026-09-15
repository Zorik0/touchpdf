import type { PDFDict, PDFRawStream } from "@cantoo/pdf-lib";
import { Segmented } from "../base/controls";
import { loadPdfLib } from "../base/engines";
import { formatBytes, outputName } from "../base/files";
import { openPdf, savePdf } from "../base/pdf";
import { defineTool, throwIfCancelled, type OptionsProps } from "../base/types";

type Level = "strong" | "balanced" | "light";
type Options = { level: Level };

const LEVELS: Record<Level, { label: string; hint: string; maxSide: number; quality: number; recodeLossless: boolean }> = {
  strong: { label: "Smallest", hint: "Images get noticeably softer.", maxSide: 1200, quality: 0.5, recodeLossless: true },
  balanced: { label: "Balanced", hint: "Good for sharing and email.", maxSide: 1800, quality: 0.68, recodeLossless: true },
  light: { label: "Best quality", hint: "Only trims oversized photos.", maxSide: 2600, quality: 0.82, recodeLossless: false },
};

/** Images too large to decode safely in a browser tab are left as they are. */
const MAX_PIXELS = 40_000_000;

function CompressOptions({ options, setOptions }: OptionsProps<Options>) {
  return (
    <div className="field">
      <Segmented
        label="Compression"
        value={options.level}
        choices={(Object.keys(LEVELS) as Level[]).map((value) => ({ value, label: LEVELS[value].label }))}
        onChange={(level) => setOptions({ level })}
      />
      <p className="field-hint">{LEVELS[options.level].hint}</p>
    </div>
  );
}

type Lib = Awaited<ReturnType<typeof loadPdfLib>>;

/** Components per pixel for the color spaces we can safely re-encode, or null to skip. */
function componentsOf(dict: PDFDict, lib: Lib): 1 | 3 | null {
  const { PDFArray, PDFName, PDFRawStream, PDFNumber } = lib;
  const space = dict.lookup(PDFName.of("ColorSpace"));
  if (space instanceof PDFName) {
    if (space.asString() === "/DeviceRGB") return 3;
    if (space.asString() === "/DeviceGray") return 1;
    return null;
  }
  if (space instanceof PDFArray && space.lookup(0)?.toString() === "/ICCBased") {
    const profile = space.lookup(1);
    const n = profile instanceof PDFRawStream ? profile.dict.lookup(PDFName.of("N")) : undefined;
    if (n instanceof PDFNumber && (n.asNumber() === 1 || n.asNumber() === 3)) return n.asNumber() as 1 | 3;
  }
  return null;
}

function filtersOf(dict: PDFDict, lib: Lib): string[] {
  const filter = dict.lookup(lib.PDFName.of("Filter"));
  if (filter instanceof lib.PDFName) return [filter.asString()];
  if (filter instanceof lib.PDFArray) return filter.asArray().map((entry) => entry.toString());
  return [];
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function toJpeg(source: CanvasImageSource, width: number, height: number, level: (typeof LEVELS)[Level]) {
  const scale = Math.min(1, level.maxSide / Math.max(width, height));
  const canvas = new OffscreenCanvas(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: level.quality });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
}

/** Re-encodes one image stream in place when the result is meaningfully smaller. */
async function recompress(stream: PDFRawStream, lib: Lib, level: (typeof LEVELS)[Level]): Promise<void> {
  const { PDFName, PDFNumber, PDFBool } = lib;
  const { dict } = stream;
  if (dict.lookup(PDFName.of("ImageMask")) instanceof PDFBool || dict.has(PDFName.of("Decode"))) return;

  const numberAt = (key: string) => {
    const value = dict.lookup(PDFName.of(key));
    return value instanceof PDFNumber ? value.asNumber() : undefined;
  };
  const width = numberAt("Width");
  const height = numberAt("Height");
  const bits = numberAt("BitsPerComponent");
  const components = componentsOf(dict, lib);
  const filters = filtersOf(dict, lib);
  if (!width || !height || width * height > MAX_PIXELS || bits !== 8 || !components) return;

  const original = stream.getContents();
  let encoded: Awaited<ReturnType<typeof toJpeg>>;

  if (filters.length === 1 && filters[0] === "/DCTDecode") {
    const bitmap = await createImageBitmap(new Blob([original as Uint8Array<ArrayBuffer>], { type: "image/jpeg" }));
    encoded = await toJpeg(bitmap, width, height, level);
    bitmap.close();
  } else if (level.recodeLossless && filters.length === 1 && filters[0] === "/FlateDecode" && !dict.has(PDFName.of("DecodeParms"))) {
    // Small lossless images are usually icons or charts that JPEG would blur.
    if (width * height < 250_000) return;
    const pixels = await inflate(original);
    if (pixels.length < width * height * components) return;
    const rgba = new ImageData(width, height);
    for (let pixel = 0, source = 0, target = 0; pixel < width * height; pixel++, target += 4) {
      if (components === 3) {
        rgba.data[target] = pixels[source++];
        rgba.data[target + 1] = pixels[source++];
        rgba.data[target + 2] = pixels[source++];
      } else {
        rgba.data[target] = rgba.data[target + 1] = rgba.data[target + 2] = pixels[source++];
      }
      rgba.data[target + 3] = 255;
    }
    encoded = await toJpeg(await createImageBitmap(rgba), width, height, level);
  } else {
    return;
  }

  if (encoded.bytes.length > original.length * 0.9) return;

  stream.updateContents(encoded.bytes);
  dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
  dict.delete(PDFName.of("DecodeParms"));
  dict.set(PDFName.of("Width"), PDFNumber.of(encoded.width));
  dict.set(PDFName.of("Height"), PDFNumber.of(encoded.height));
  dict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
  // Browsers only write color JPEGs, so gray images become RGB.
  if (components === 1) dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
}

export default defineTool<Options>({
  defaults: { level: "balanced" },
  Options: CompressOptions,
  actionLabel: () => "Compress PDF",

  async run(files, options, { progress, signal }) {
    const lib = await loadPdfLib();
    const input = files[0];
    const doc = await openPdf(input);

    const images: PDFRawStream[] = [];
    for (const [, object] of doc.context.enumerateIndirectObjects()) {
      if (object instanceof lib.PDFRawStream && object.dict.lookup(lib.PDFName.of("Subtype"))?.toString() === "/Image") {
        images.push(object);
      }
    }

    for (const [index, image] of images.entries()) {
      throwIfCancelled(signal);
      try {
        await recompress(image, lib, LEVELS[options.level]);
      } catch {
        // An image the browser can't decode is kept exactly as it was.
      }
      progress(index + 1, images.length);
    }

    const blob = await savePdf(doc);
    const before = input.file.size;
    const name = outputName(input.file.name, "-compressed", "pdf");
    if (blob.size >= before) {
      return [{ name, blob: input.file, note: "This PDF is already compact, so it's unchanged." }];
    }
    const saved = Math.round((1 - blob.size / before) * 100);
    return [{ name, blob, note: `${saved}% smaller, down from ${formatBytes(before)}` }];
  },
});
