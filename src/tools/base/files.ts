export type FileKind = "pdf" | "image" | "docx" | "xlsx" | "pptx";

export type ToolFile = {
  id: string;
  file: File;
  /** Set once the user unlocks a password-protected PDF. */
  password?: string;
};

/** What a tool accepts, as declared in the registry. */
export type ToolInput = { accept: FileKind; multiple: boolean };

type KindInfo = { mime: string[]; extensions: string[]; one: string; many: string };

export const FILE_KINDS: Record<FileKind, KindInfo> = {
  pdf: { mime: ["application/pdf"], extensions: [".pdf"], one: "a PDF", many: "PDFs" },
  image: {
    mime: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    one: "an image",
    many: "JPG, PNG or WebP images",
  },
  docx: {
    mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    extensions: [".docx"],
    one: "a Word document",
    many: "Word documents",
  },
  xlsx: {
    mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    extensions: [".xlsx"],
    one: "an Excel spreadsheet",
    many: "Excel spreadsheets",
  },
  pptx: {
    mime: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    extensions: [".pptx"],
    one: "a PowerPoint file",
    many: "PowerPoint files",
  },
};

export function acceptAttribute(kind: FileKind): string {
  const { mime, extensions } = FILE_KINDS[kind];
  return [...mime, ...extensions].join(",");
}

export function matchesKind(file: File, kind: FileKind): boolean {
  const { mime, extensions } = FILE_KINDS[kind];
  const name = file.name.toLowerCase();
  return mime.includes(file.type) || extensions.some((extension) => name.endsWith(extension));
}

export function toToolFiles(files: Iterable<File>): ToolFile[] {
  return Array.from(files, (file) => ({ id: crypto.randomUUID(), file }));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

export function baseName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

/** "report.pdf" + "-merged" + "pdf" → "report-merged.pdf" */
export function outputName(inputName: string, suffix: string, extension: string): string {
  return `${baseName(inputName)}${suffix}.${extension}`;
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const bytesCache = new WeakMap<File, Promise<ArrayBuffer>>();

/** A fresh copy of the file's bytes. pdf.js detaches the buffers it's given, so never share them. */
export async function readBytes(file: File): Promise<Uint8Array> {
  let buffer = bytesCache.get(file);
  if (!buffer) {
    buffer = file.arrayBuffer();
    bytesCache.set(file, buffer);
  }
  return new Uint8Array((await buffer).slice(0));
}
