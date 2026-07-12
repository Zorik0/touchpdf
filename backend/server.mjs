// ── TouchPDF backend ─────────────────────────────────────────────────────────
// Server-side muscle for the tools the browser can't do well:
//   POST /api/convert?to=pdf    docx/doc/xlsx/xls/pptx/ppt/odt/ods/odp/rtf/txt → PDF (LibreOffice)
//   POST /api/convert?to=docx   PDF → editable Word (LibreOffice pdf import)
//   POST /api/compress?level=…  real PDF compression (Ghostscript: screen/ebook/printer)
//   GET  /api/health
// Uploads are raw bodies (Content-Type: application/octet-stream) with the
// original name in X-Filename. Stateless: every job runs in its own temp dir,
// which is deleted afterwards — files are never kept.
//
// Deliberately zero npm deps. Runs as an unprivileged user under systemd with
// PrivateTmp, so jobs are invisible to other services on the host.

import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const PORT = Number(process.env.PORT || 4100);
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB upload cap
const JOB_TIMEOUT_MS = 120_000;
const MAX_CONCURRENT = 2;
const MAX_QUEUE = 10;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map((s) => s.trim()).filter(Boolean);

// Office formats LibreOffice may read for →PDF. PDF is accepted only for →docx.
const OFFICE_EXT = new Set(["docx", "doc", "xlsx", "xls", "pptx", "ppt", "odt", "ods", "odp", "rtf", "txt", "csv", "md"]);
const GS_LEVELS = new Set(["screen", "ebook", "printer"]);

// ── Tiny job queue (LibreOffice is heavy; cap parallelism) ───────────────────

let running = 0;
const queue = [];
function schedule(job) {
  return new Promise((resolve, reject) => {
    if (running >= MAX_CONCURRENT && queue.length >= MAX_QUEUE) {
      reject(Object.assign(new Error("busy"), { status: 503 }));
      return;
    }
    queue.push({ job, resolve, reject });
    pump();
  });
}
function pump() {
  while (running < MAX_CONCURRENT && queue.length) {
    const { job, resolve, reject } = queue.shift();
    running += 1;
    job()
      .then(resolve, reject)
      .finally(() => {
        running -= 1;
        pump();
      });
  }
}

// ── Rate limiting (per client IP, behind Caddy) ──────────────────────────────

const buckets = new Map();
function rateLimited(ip, max = 40, windowMs = 3_600_000) {
  const now = Date.now();
  const arr = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(ip, arr);
    return true;
  }
  arr.push(now);
  buckets.set(ip, arr);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of buckets) {
    if (!arr.length || now - arr[arr.length - 1] > 3_600_000) buckets.delete(k);
  }
}, 600_000).unref();

// ── Helpers ──────────────────────────────────────────────────────────────────

const clientIp = (req) =>
  (typeof req.headers["x-forwarded-for"] === "string" && req.headers["x-forwarded-for"].split(",")[0].trim()) ||
  req.socket.remoteAddress || "";

function fail(res, status, message) {
  const body = JSON.stringify({ error: message });
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BYTES) {
        reject(Object.assign(new Error("File is larger than 50 MB."), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Original name → safe base + validated extension. */
function parseName(req) {
  const raw = decodeURIComponent(String(req.headers["x-filename"] ?? "file"));
  const ext = (raw.split(".").pop() ?? "").toLowerCase();
  const base = path.basename(raw, `.${ext}`).replace(/[^\w .-]+/g, "_").slice(0, 120) || "file";
  return { base, ext };
}

/** Run a command in its own process group; kill the whole group on timeout. */
function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, detached: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
      reject(Object.assign(new Error("Conversion timed out."), { status: 422 }));
    }, JOB_TIMEOUT_MS);
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(Object.assign(new Error(`converter exited ${code}: ${stderr.slice(0, 400)}`), { status: 422 }));
    });
  });
}

async function withTempDir(fn) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "touchpdf-"));
  try {
    return await fn(dir);
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// ── Converters ───────────────────────────────────────────────────────────────

async function convert(buffer, ext, to) {
  return withTempDir(async (dir) => {
    const inPath = path.join(dir, `input.${ext}`);
    await writeFile(inPath, buffer);
    // A per-job LibreOffice profile allows parallel instances.
    const profile = `-env:UserInstallation=file://${dir}/lo-profile`;
    const args =
      to === "docx" && ext === "pdf"
        ? [profile, "--headless", "--infilter=writer_pdf_import", "--convert-to", "docx:MS Word 2007 XML", "--outdir", dir, inPath]
        : [profile, "--headless", "--convert-to", "pdf", "--outdir", dir, inPath];
    await run("soffice", args, dir);
    const out = (await readdir(dir)).find((f) => f.startsWith("input.") && f.endsWith(`.${to}`));
    if (!out) throw Object.assign(new Error("Conversion produced no output."), { status: 422 });
    return readFile(path.join(dir, out));
  });
}

async function compress(buffer, level) {
  return withTempDir(async (dir) => {
    const inPath = path.join(dir, "input.pdf");
    const outPath = path.join(dir, "output.pdf");
    await writeFile(inPath, buffer);
    await run(
      "gs",
      [
        "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.5", `-dPDFSETTINGS=/${level}`,
        "-dNOPAUSE", "-dQUIET", "-dBATCH", "-dSAFER",
        `-sOutputFile=${outPath}`, inPath,
      ],
      dir
    );
    const out = await readFile(outPath);
    // Ghostscript can occasionally inflate an already-optimal file — never
    // hand back something bigger than the original.
    return out.length < buffer.length ? out : buffer;
  });
}

// ── HTTP ─────────────────────────────────────────────────────────────────────

const MIME = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || (origin.endsWith(".vercel.app") && origin.startsWith("https://")))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Filename");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (url.pathname === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, queue: queue.length, running }));
      return;
    }
    if (req.method !== "POST") return fail(res, 404, "not found");

    if (rateLimited(clientIp(req))) {
      return fail(res, 429, "Too many conversions from your network — try again in a bit.");
    }

    if (url.pathname === "/api/convert") {
      const to = url.searchParams.get("to") === "docx" ? "docx" : "pdf";
      const { base, ext } = parseName(req);
      if (to === "docx" && ext !== "pdf") return fail(res, 400, "PDF → Word needs a .pdf file.");
      if (to === "pdf" && !OFFICE_EXT.has(ext)) return fail(res, 400, `Can't convert .${ext} to PDF.`);
      const body = await readBody(req);
      if (!body.length) return fail(res, 400, "Empty upload.");
      const out = await schedule(() => convert(body, ext, to));
      res.writeHead(200, {
        "Content-Type": MIME[to],
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${base}.${to}`)}`,
        "Content-Length": out.length,
        "Cache-Control": "no-store",
      });
      res.end(out);
      return;
    }

    if (url.pathname === "/api/compress") {
      const level = GS_LEVELS.has(url.searchParams.get("level")) ? url.searchParams.get("level") : "ebook";
      const { base, ext } = parseName(req);
      if (ext !== "pdf") return fail(res, 400, "Compression needs a .pdf file.");
      const body = await readBody(req);
      if (!body.length) return fail(res, 400, "Empty upload.");
      const out = await schedule(() => compress(body, level));
      res.writeHead(200, {
        "Content-Type": MIME.pdf,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${base}_compressed.pdf`)}`,
        "Content-Length": out.length,
        "Cache-Control": "no-store",
      });
      res.end(out);
      return;
    }

    fail(res, 404, "not found");
  } catch (e) {
    const status = e?.status ?? 500;
    if (status === 500) console.error(`[touchpdf] ${req.method} ${url.pathname} failed:`, e);
    if (!res.headersSent) {
      fail(res, status, status === 503 ? "Server is busy — try again in a minute." : e.message ?? "Conversion failed.");
    } else {
      res.destroy();
    }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[touchpdf-backend] listening on 127.0.0.1:${PORT}`);
});
