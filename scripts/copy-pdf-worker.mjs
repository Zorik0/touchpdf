// Copies the pdf.js worker into public/ so it's served from our own origin and
// always matches the installed pdfjs-dist version. Runs after `npm install`.
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const pdfjsDir = path.dirname(require.resolve("pdfjs-dist/package.json"));
const source = path.join(pdfjsDir, "build", "pdf.worker.min.mjs");
const target = path.join(process.cwd(), "public", "pdf.worker.min.mjs");

await mkdir(path.dirname(target), { recursive: true });
await copyFile(source, target);
console.log("Copied pdf.js worker to public/pdf.worker.min.mjs");
