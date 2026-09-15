"use client";

import type { PDFDict, PDFDocument, PDFRawStream } from "@cantoo/pdf-lib";
import type { CSSProperties } from "react";
import { Toggle } from "../base/controls";
import { loadPdfLib } from "../base/engines";
import { formatBytes, outputName, type ToolFile } from "../base/files";
import { openPdf, openPdfView, savePdf } from "../base/pdf";
import { defineTool, throwIfCancelled, type OptionsProps } from "../base/types";

const KB = 1024;
/** The smallest target on offer. Below this, pages stop being readable. */
const MIN_TARGET = 100 * KB;
const PRESETS = [100, 200, 500, 1024, 2048, 5120].map((kb) => kb * KB);

/** targetBytes 0 means "not chosen yet", so the dial suggests a size for the file. */
type Options = { targetBytes: number; keepText: boolean };

// Image settings, gentlest first. Each step trades more image detail for size.
const IMAGE_STEPS = [
  { maxSide: 2600, quality: 0.82 },
  { maxSide: 1800, quality: 0.68 },
  { maxSide: 1400, quality: 0.56 },
  { maxSide: 1000, quality: 0.45 },
  { maxSide: 750, quality: 0.35 },
  { maxSide: 520, quality: 0.28 },
];

// Page-image settings, gentlest first, used only when text doesn't need to stay selectable.
const FLATTEN_STEPS = [
  { dpi: 150, quality: 0.7 },
  { dpi: 120, quality: 0.6 },
  { dpi: 96, quality: 0.5 },
  { dpi: 72, quality: 0.45 },
  { dpi: 60, quality: 0.38 },
  { dpi: 48, quality: 0.32 },
  { dpi: 40, quality: 0.26 },
];

/** Images too large to decode safely in a browser tab are left as they are. */
const MAX_PIXELS = 40_000_000;
/** iOS Safari refuses to draw canvases larger than this. */
const MAX_CANVAS_PIXELS = 16_000_000;

// ---------------------------------------------------------------------------
// The target size dial

/** Sizes snap to 10 KB steps under 1 MB, and 0.1 MB steps above. */
const stepFor = (bytes: number) => (bytes >= 1024 * KB ? 102.4 * KB : 10 * KB);
const niceSize = (bytes: number) => Math.round(bytes / stepFor(bytes)) * stepFor(bytes);

/** The next nice size up or down, so arrow keys always move the dial. */
function nudge(bytes: number, direction: 1 | -1, max: number): number {
  const step = stepFor(direction > 0 ? bytes : bytes - 1);
  const next = niceSize(bytes) + direction * step;
  return Math.min(max, Math.max(MIN_TARGET, next));
}

/** The dial is logarithmic, so 100 KB to 200 KB gets as much room as 1 MB to 2 MB. */
const toPosition = (bytes: number, max: number) => Math.log(bytes / MIN_TARGET) / Math.log(max / MIN_TARGET);
const toBytes = (position: number, max: number) => MIN_TARGET * Math.pow(max / MIN_TARGET, position);

export function suggestedTarget(original: number): number {
  return Math.max(MIN_TARGET, Math.min(original, niceSize(original * 0.4)));
}

function TargetSize({ files, options, setOptions }: OptionsProps<Options>) {
  const original = files[0]?.file.size ?? 0;

  if (original <= MIN_TARGET) {
    return <p className="field-hint">This PDF is already under 100 KB, so there&apos;s nothing to squeeze.</p>;
  }

  const target = Math.min(original, Math.max(MIN_TARGET, options.targetBytes || suggestedTarget(original)));
  const position = toPosition(target, original);
  const smaller = Math.round((1 - target / original) * 100);
  const setTarget = (bytes: number) => setOptions({ ...options, targetBytes: bytes });

  // Quick picks smaller than the file, always including 100 KB.
  const presets = PRESETS.filter((preset) => preset < original * 0.95);

  return (
    <>
      <div className="size-dial" style={{ "--position": position } as CSSProperties}>
        <div className="size-readout">
          <span className="field-label" id="target-size-label">
            Make it about
          </span>
          <output className="size-value" htmlFor="target-size">
            {formatBytes(target)}
          </output>
          <span className="size-change">
            {smaller >= 1 ? `${smaller}% smaller than ${formatBytes(original)}` : `The same as now, ${formatBytes(original)}`}
          </span>
        </div>

        <input
          id="target-size"
          className="size-range"
          type="range"
          min={0}
          max={1000}
          value={Math.round(position * 1000)}
          aria-labelledby="target-size-label"
          aria-valuetext={formatBytes(target)}
          onChange={(event) => setTarget(niceSize(toBytes(event.target.valueAsNumber / 1000, original)))}
          onKeyDown={(event) => {
            const keys: Record<string, [1 | -1, number]> = {
              ArrowLeft: [-1, 1],
              ArrowDown: [-1, 1],
              ArrowRight: [1, 1],
              ArrowUp: [1, 1],
              PageDown: [-1, 10],
              PageUp: [1, 10],
            };
            if (event.key === "Home") return (event.preventDefault(), setTarget(MIN_TARGET));
            if (event.key === "End") return (event.preventDefault(), setTarget(original));
            const move = keys[event.key];
            if (!move) return;
            event.preventDefault();
            let next = target;
            for (let step = 0; step < move[1]; step++) next = nudge(next, move[0], original);
            setTarget(next);
          }}
        />

        <div className="size-ticks" aria-hidden="true">
          {presets.map((preset) => (
            <span key={preset} style={{ "--at": toPosition(preset, original) } as CSSProperties} />
          ))}
        </div>

        <div className="size-presets" role="group" aria-label="Quick sizes">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className="size-preset"
              aria-pressed={Math.abs(preset - target) < KB}
              onClick={() => setTarget(preset)}
            >
              {formatBytes(preset)}
            </button>
          ))}
        </div>
      </div>

      <Toggle
        label="Keep text selectable"
        checked={options.keepText}
        onChange={(keepText) => setOptions({ ...options, keepText })}
        hint={
          options.keepText
            ? "Only images are compressed. Very small targets may not be reachable."
            : "To reach very small sizes, pages can be turned into images, so their text can't be copied."
        }
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Compression passes

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

async function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const output = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(output).arrayBuffer());
}

async function jpegFrom(source: CanvasImageSource, width: number, height: number, maxSide: number, quality: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = new OffscreenCanvas(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
}

/** Lossless: Flate-compresses streams that were stored uncompressed, such as page contents. */
async function compressLooseStreams(doc: PDFDocument, lib: Lib): Promise<void> {
  const { PDFName, PDFRawStream } = lib;
  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream) || object.dict.has(PDFName.of("Filter"))) continue;
    const type = object.dict.lookup(PDFName.of("Type"))?.toString();
    if (type === "/Metadata" || type === "/XRef") continue;
    const contents = object.getContents();
    if (contents.length < 256) continue;
    const packed = await transform(contents, new CompressionStream("deflate"));
    if (packed.length >= contents.length * 0.9) continue;
    object.updateContents(packed);
    object.dict.set(PDFName.of("Filter"), PDFName.of("FlateDecode"));
  }
}

/** Re-encodes one image stream in place when the result is meaningfully smaller. */
async function recompressImage(stream: PDFRawStream, lib: Lib, step: (typeof IMAGE_STEPS)[number]): Promise<void> {
  const { PDFName, PDFNumber, PDFBool } = lib;
  const { dict } = stream;
  if (dict.lookup(PDFName.of("ImageMask")) instanceof PDFBool || dict.has(PDFName.of("Decode"))) return;

  const numberAt = (key: string) => {
    const value = dict.lookup(PDFName.of(key));
    return value instanceof PDFNumber ? value.asNumber() : undefined;
  };
  const width = numberAt("Width");
  const height = numberAt("Height");
  const components = componentsOf(dict, lib);
  const filters = filtersOf(dict, lib);
  if (!width || !height || width * height > MAX_PIXELS || numberAt("BitsPerComponent") !== 8 || !components) return;

  const original = stream.getContents();
  let encoded: Awaited<ReturnType<typeof jpegFrom>>;

  if (filters.length === 1 && filters[0] === "/DCTDecode") {
    const bitmap = await createImageBitmap(new Blob([original as Uint8Array<ArrayBuffer>], { type: "image/jpeg" }));
    encoded = await jpegFrom(bitmap, width, height, step.maxSide, step.quality);
    bitmap.close();
  } else if (filters.length === 1 && filters[0] === "/FlateDecode" && !dict.has(PDFName.of("DecodeParms"))) {
    // Small lossless images are usually icons or charts that JPEG would blur.
    if (width * height < 250_000) return;
    const pixels = await transform(original, new DecompressionStream("deflate"));
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
    encoded = await jpegFrom(await createImageBitmap(rgba), width, height, step.maxSide, step.quality);
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

/** A fresh copy of the PDF with loose streams packed and, optionally, images re-encoded. */
async function keepTextPass(file: ToolFile, lib: Lib, step: (typeof IMAGE_STEPS)[number] | null, signal: AbortSignal) {
  const doc = await openPdf(file);
  await compressLooseStreams(doc, lib);
  if (step) {
    for (const [, object] of doc.context.enumerateIndirectObjects()) {
      throwIfCancelled(signal);
      if (object instanceof lib.PDFRawStream && object.dict.lookup(lib.PDFName.of("Subtype"))?.toString() === "/Image") {
        await recompressImage(object, lib, step).catch(() => undefined);
      }
    }
  }
  return savePdf(doc);
}

/** Rebuilds the PDF with every page as a JPEG image at the given resolution. */
async function flattenPass(file: ToolFile, lib: Lib, step: (typeof FLATTEN_STEPS)[number], signal: AbortSignal) {
  const pdf = await openPdfView(file);
  try {
    const output = await lib.PDFDocument.create();
    for (let number = 1; number <= pdf.numPages; number++) {
      throwIfCancelled(signal);
      const page = await pdf.getPage(number);
      const size = page.getViewport({ scale: 1 });
      let scale = step.dpi / 72;
      const pixels = size.width * size.height * scale * scale;
      if (pixels > MAX_CANVAS_PIXELS) scale *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      await page.render({ canvas, viewport, background: "#ffffff" }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", step.quality));
      canvas.width = canvas.height = 0;
      page.cleanup();
      if (!blob) throw new Error("This browser couldn't draw one of the pages.");
      const image = await output.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      output.addPage([size.width, size.height]).drawImage(image, { x: 0, y: 0, width: size.width, height: size.height });
    }
    return savePdf(output);
  } finally {
    await pdf.loadingTask.destroy();
  }
}

/**
 * Finds the gentlest step whose result fits the target, assuming stronger steps
 * never make the file bigger. Returns the fitting result, or the smallest seen.
 */
async function gentlestFitting<Step>(
  steps: Step[],
  attempt: (step: Step) => Promise<Blob>,
  target: number,
): Promise<{ blob: Blob; fits: boolean }> {
  let smallest: Blob | undefined;
  const tryStep = async (index: number) => {
    const blob = await attempt(steps[index]);
    if (!smallest || blob.size < smallest.size) smallest = blob;
    return blob;
  };

  const strongest = await tryStep(steps.length - 1);
  if (strongest.size > target) return { blob: smallest!, fits: false };

  let best = strongest;
  let low = 0;
  let high = steps.length - 2;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const blob = await tryStep(middle);
    if (blob.size <= target) {
      best = blob;
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }
  return { blob: best, fits: true };
}

export default defineTool<Options>({
  defaults: { targetBytes: 0, keepText: false },
  Options: TargetSize,

  actionLabel: (files, options) => {
    const original = files[0]?.file.size ?? 0;
    if (original <= MIN_TARGET) return "Compress PDF";
    const target = Math.min(original, options.targetBytes || suggestedTarget(original));
    return `Compress to ${formatBytes(target)}`;
  },

  async run(files, options, { progress, signal }) {
    const lib = await loadPdfLib();
    const input = files[0];
    const original = input.file.size;
    const target = Math.min(original, Math.max(MIN_TARGET, options.targetBytes || suggestedTarget(original)));
    const name = outputName(input.file.name, "-compressed", "pdf");
    const summary = (blob: Blob) => `${Math.round((1 - blob.size / original) * 100)}% smaller, down from ${formatBytes(original)}`;

    if (original <= target) {
      return [{ name, blob: input.file, note: `It's already ${formatBytes(original)}, so it's unchanged.` }];
    }

    // Rough progress: each attempt is one step of the bar.
    let attempts = 0;
    const budget = 1 + 4 + (options.keepText ? 0 : 4);
    const counted = <T,>(work: Promise<T>) =>
      work.then((result) => {
        progress(++attempts, budget);
        return result;
      });

    // 1. Lossless packing alone.
    const lossless = await counted(keepTextPass(input, lib, null, signal));
    if (lossless.size <= target) return [{ name, blob: lossless, note: `${summary(lossless)}, with no loss in quality.` }];

    // 2. Compress images, keeping text as text.
    const images = await gentlestFitting(IMAGE_STEPS, (step) => counted(keepTextPass(input, lib, step, signal)), target);
    const keptText = images.blob.size < lossless.size ? images.blob : lossless;
    if (images.fits) return [{ name, blob: images.blob, note: summary(images.blob) }];

    // 3. Turn pages into images, if allowed.
    let smallest = keptText;
    let flattened = false;
    if (!options.keepText) {
      const flat = await gentlestFitting(FLATTEN_STEPS, (step) => counted(flattenPass(input, lib, step, signal)), target);
      if (flat.fits) {
        return [
          {
            name,
            blob: flat.blob,
            note: `${summary(flat.blob)}. Pages were turned into images to get this small, so their text can't be copied.`,
          },
        ];
      }
      if (flat.blob.size < smallest.size) {
        smallest = flat.blob;
        flattened = true;
      }
    }

    if (smallest.size >= original) {
      return [{ name, blob: input.file, note: "This PDF is already as compact as it can get, so it's unchanged." }];
    }
    const advice = options.keepText
      ? " Turning off Keep text selectable can get it smaller."
      : flattened
        ? " Its pages were turned into images, so their text can't be copied."
        : "";
    // One decimal here, so "100.4 KB" never reads as reaching a 100 KB target.
    const precise = smallest.size < 1024 * KB ? `${(smallest.size / KB).toFixed(1).replace(/\.0$/, "")} KB` : formatBytes(smallest.size);
    return [
      {
        name,
        blob: smallest,
        note: `The smallest this PDF can go is ${precise}, so it couldn't reach ${formatBytes(target)}.${advice}`,
      },
    ];
  },
});
