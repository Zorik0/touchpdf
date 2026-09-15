"use client";

import { useEffect, useState } from "react";
import { formatBytes, matchesKind, type ToolFile } from "./files";
import { openPdfView, PasswordError } from "./pdf";
import { renderPage } from "./pages";

export type FileStatus =
  | { state: "reading" }
  | { state: "ready"; pages?: number }
  | { state: "locked"; wrong: boolean }
  | { state: "broken"; message: string };

type FileListProps = {
  files: ToolFile[];
  statuses: Record<string, FileStatus>;
  reorderable: boolean;
  disabled: boolean;
  onStatus: (id: string, status: FileStatus) => void;
  onMove: (id: string, offset: -1 | 1) => void;
  onRemove: (id: string) => void;
  onPassword: (id: string, password: string) => void;
};

/** PDFs and images are read for a preview first; other files are ready as soon as they're added. */
export function initialStatus(toolFile: ToolFile): FileStatus {
  const readable = matchesKind(toolFile.file, "pdf") || matchesKind(toolFile.file, "image");
  return readable ? { state: "reading" } : { state: "ready" };
}

export function FileList({ files, statuses, reorderable, disabled, ...handlers }: FileListProps) {
  return (
    <ol className="file-list">
      {files.map((toolFile, index) => (
        <FileRow
          key={toolFile.id}
          toolFile={toolFile}
          status={statuses[toolFile.id] ?? initialStatus(toolFile)}
          position={reorderable && files.length > 1 ? { index, count: files.length } : undefined}
          disabled={disabled}
          {...handlers}
        />
      ))}
    </ol>
  );
}

type FileRowProps = Omit<FileListProps, "files" | "statuses" | "reorderable"> & {
  toolFile: ToolFile;
  status: FileStatus;
  position?: { index: number; count: number };
};

function FileRow({ toolFile, status, position, disabled, onStatus, onMove, onRemove, onPassword }: FileRowProps) {
  const { file, id } = toolFile;
  const preview = usePreview(toolFile, onStatus);
  const [password, setPassword] = useState("");

  const details = [formatBytes(file.size)];
  if (status.state === "ready" && status.pages) details.push(`${status.pages} page${status.pages === 1 ? "" : "s"}`);

  return (
    <li className="file-row">
      <div className="sheet" aria-hidden="true">
        {/* A local blob URL, so next/image can't optimize it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="" />}
      </div>
      <div className="file-main">
        <p className="file-name">{file.name}</p>
        <p className="file-details">{details.join(", ")}</p>

        {status.state === "broken" && <p className="field-error">{status.message}</p>}

        {status.state === "locked" && (
          <form
            className="unlock"
            onSubmit={(event) => {
              event.preventDefault();
              if (password) onPassword(id, password);
            }}
          >
            <label className="field-label" htmlFor={`${id}-password`}>
              {status.wrong ? "That password didn't work. Try again." : "This PDF is password-protected."}
            </label>
            <div className="unlock-row">
              <input
                id={`${id}-password`}
                className="input"
                type="password"
                autoComplete="off"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button type="submit" className="btn btn-quiet" disabled={!password}>
                Unlock
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="file-actions">
        {position && (
          <>
            <button
              type="button"
              className="icon-button"
              aria-label={`Move ${file.name} up`}
              disabled={disabled || position.index === 0}
              onClick={() => onMove(id, -1)}
            >
              <Arrow direction="up" />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={`Move ${file.name} down`}
              disabled={disabled || position.index === position.count - 1}
              onClick={() => onMove(id, 1)}
            >
              <Arrow direction="down" />
            </button>
          </>
        )}
        <button
          type="button"
          className="icon-button"
          aria-label={`Remove ${file.name}`}
          disabled={disabled}
          onClick={() => onRemove(id)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </li>
  );
}

function Arrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={direction === "up" ? "M8 13V3M4 7l4-4 4 4" : "M8 3v10M4 9l4 4 4-4"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const THUMB_WIDTH = 56;

/** Reads a file once to show its first page and page count, and to spot passwords. */
function usePreview(toolFile: ToolFile, onStatus: (id: string, status: FileStatus) => void): string | undefined {
  const [preview, setPreview] = useState<string>();

  useEffect(() => {
    const isPdf = matchesKind(toolFile.file, "pdf");
    if (!isPdf && !matchesKind(toolFile.file, "image")) return;

    let cancelled = false;
    let url: string | undefined;

    (async () => {
      try {
        let canvas: HTMLCanvasElement;
        let pages: number | undefined;
        if (isPdf) {
          const pdf = await openPdfView(toolFile);
          pages = pdf.numPages;
          canvas = await renderPage(pdf, 0, THUMB_WIDTH);
          await pdf.loadingTask.destroy();
        } else {
          canvas = await imageThumbnail(toolFile.file, THUMB_WIDTH);
        }
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (cancelled || !blob) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
        onStatus(toolFile.id, { state: "ready", pages });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof PasswordError) onStatus(toolFile.id, { state: "locked", wrong: error.wrong });
        else onStatus(toolFile.id, { state: "broken", message: `${toolFile.file.name} couldn't be opened.` });
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // Re-read only when the file or its password changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolFile.file, toolFile.password]);

  return preview;
}

async function imageThumbnail(file: File, cssWidth: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const width = cssWidth * Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round((bitmap.height / bitmap.width) * width);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}
