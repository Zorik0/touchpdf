import type { PDFDocument } from "@cantoo/pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdfJs, loadPdfLib } from "./engines";
import { readBytes, type ToolFile } from "./files";

/** Thrown when a PDF needs a password the user hasn't given, or the one given is wrong. */
export class PasswordError extends Error {
  constructor(
    readonly fileId: string,
    readonly wrong: boolean,
  ) {
    super(wrong ? "That password didn't work." : "This PDF is password-protected.");
  }
}

/**
 * Opens a PDF for editing. Files with only permission restrictions open without asking.
 * Encrypted files come back fully decrypted, so saving them never produces a broken copy.
 */
export async function openPdf(toolFile: ToolFile): Promise<PDFDocument> {
  const { PDFDocument, EncryptedPDFError } = await loadPdfLib();
  try {
    const doc = await PDFDocument.load(await readBytes(toolFile.file), {
      password: toolFile.password ?? "",
      updateMetadata: false,
    });
    if (doc.context.isDecrypted) await stripEncryption(doc);
    return doc;
  } catch (error) {
    if (error instanceof EncryptedPDFError) throw new PasswordError(toolFile.id, false);
    if (error instanceof Error && /password incorrect/i.test(error.message)) {
      throw new PasswordError(toolFile.id, Boolean(toolFile.password));
    }
    throw new Error(`${toolFile.file.name} couldn't be read. It may be damaged or not a real PDF.`);
  }
}

/** Opens a PDF for reading and rendering pages. */
export async function openPdfView(toolFile: ToolFile): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: await readBytes(toolFile.file), password: toolFile.password });
  try {
    return await task.promise;
  } catch (error) {
    if (error instanceof pdfjs.PasswordException) {
      throw new PasswordError(toolFile.id, error.code === pdfjs.PasswordResponses.INCORRECT_PASSWORD);
    }
    throw new Error(`${toolFile.file.name} couldn't be read. It may be damaged or not a real PDF.`);
  }
}

const encryption = new WeakMap<File, Promise<boolean>>();

/** Whether a PDF has any encryption, including permission-only restrictions. */
export function isEncrypted(toolFile: ToolFile): Promise<boolean> {
  let result = encryption.get(toolFile.file);
  if (!result) {
    result = (async () => {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await readBytes(toolFile.file), { ignoreEncryption: true, updateMetadata: false });
      return doc.isEncrypted;
    })();
    encryption.set(toolFile.file, result);
  }
  return result;
}

const pageCounts = new WeakMap<File, Map<string, Promise<number>>>();

/** Page count, read once per file (and password) in pdf.js's worker so typing in options stays smooth. */
export function countPages(toolFile: ToolFile): Promise<number> {
  let byPassword = pageCounts.get(toolFile.file);
  if (!byPassword) {
    byPassword = new Map();
    pageCounts.set(toolFile.file, byPassword);
  }
  const key = toolFile.password ?? "";
  let count = byPassword.get(key);
  if (!count) {
    count = openPdfView(toolFile).then(async (pdf) => {
      const pages = pdf.numPages;
      await pdf.loadingTask.destroy();
      return pages;
    });
    count.catch(() => byPassword.delete(key));
    byPassword.set(key, count);
  }
  return count;
}

/**
 * Removes what's left of the security handler after a PDF was opened with its password,
 * so the saved copy opens without one.
 */
async function stripEncryption(doc: PDFDocument): Promise<void> {
  const { PDFDict, PDFName, PDFRawStream } = await loadPdfLib();
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    const dict = object instanceof PDFDict ? object : object instanceof PDFRawStream ? object.dict : undefined;
    if (!dict) continue;
    const isSecurityHandler =
      dict.get(PDFName.of("Filter"))?.toString() === "/Standard" && dict.has(PDFName.of("O"));
    const isStaleTrailer = dict.has(PDFName.of("Root")) && dict.has(PDFName.of("Size"));
    if (isSecurityHandler || isStaleTrailer) doc.context.delete(ref);
  }
}

export async function savePdf(doc: PDFDocument): Promise<Blob> {
  const bytes = await doc.save({ useObjectStreams: true });
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
}
