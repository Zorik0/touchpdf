// ── TouchPDF conversion API ──────────────────────────────────────────────────
// The tools that genuinely need server-side muscle (Office ↔ PDF, real
// compression) call our VPS backend: LibreOffice + Ghostscript behind a tiny
// stateless service. Files are processed in a throwaway temp dir and deleted
// the moment the response is sent — nothing is stored.
// The client-side code paths remain as fallbacks when the API is unreachable.

export const API_BASE = (
  process.env.NEXT_PUBLIC_TOUCHPDF_API ?? 'https://api-touchpdf.72-61-241-71.sslip.io'
).replace(/\/+$/, '');

async function post(path: string, file: File): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Filename': encodeURIComponent(file.name),
    },
    body: file,
  });
  if (!res.ok) {
    let message = `Conversion failed (${res.status})`;
    try {
      message = ((await res.json()) as { error?: string }).error ?? message;
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, message);
  }
  return res.blob();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** True Office→PDF / PDF→Word conversion (LibreOffice). */
export function serverConvert(file: File, to: 'pdf' | 'docx'): Promise<Blob> {
  return post(`/api/convert?to=${to}`, file);
}

/** Real PDF compression (Ghostscript). Level ≈ target quality. */
export function serverCompress(file: File, level: 'screen' | 'ebook' | 'printer' = 'ebook'): Promise<Blob> {
  return post(`/api/compress?level=${level}`, file);
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Network-level failure (server down/unreachable) — worth a client fallback.
 *  4xx responses are real answers (bad file, too big) and should be shown. */
export const isUnreachable = (e: unknown) =>
  !(e instanceof ApiError) || e.status === 429 || e.status === 503;
