"use client";

import { useState } from "react";
import { loadZip } from "./engines";
import { downloadBlob, formatBytes } from "./files";
import type { ToolOutput } from "./types";

type ResultsProps = {
  outputs: ToolOutput[];
  zipName: string;
  /** Returns to the options. Omitted for tools without any. */
  onBack?: () => void;
  onStartOver: () => void;
};

export function Results({ outputs, zipName, onBack, onStartOver }: ResultsProps) {
  const [zipping, setZipping] = useState(false);
  const single = outputs.length === 1 ? outputs[0] : undefined;

  async function downloadAll() {
    setZipping(true);
    try {
      const JSZip = await loadZip();
      const zip = new JSZip();
      for (const output of outputs) zip.file(output.name, output.blob);
      downloadBlob(await zip.generateAsync({ type: "blob" }), zipName);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="results" aria-live="polite">
      <h2 className="panel-title">{single ? "Your file is ready" : `${outputs.length} files are ready`}</h2>

      <ul className="output-list">
        {outputs.map((output) => (
          <li key={output.name} className="output-row">
            <span className="file-name">{output.name}</span>
            <span className="file-details">{formatBytes(output.blob.size)}</span>
            {!single && (
              <button type="button" className="link-button" onClick={() => downloadBlob(output.blob, output.name)}>
                Download
              </button>
            )}
          </li>
        ))}
      </ul>

      {single ? (
        <button type="button" className="btn btn-primary btn-block" onClick={() => downloadBlob(single.blob, single.name)}>
          Download
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-block" disabled={zipping} onClick={downloadAll}>
          {zipping ? "Preparing ZIP…" : "Download all as ZIP"}
        </button>
      )}

      <div className="panel-links">
        {onBack && (
          <button type="button" className="link-button" onClick={onBack}>
            Change options
          </button>
        )}
        <button type="button" className="link-button" onClick={onStartOver}>
          Start over with new files
        </button>
      </div>
    </div>
  );
}
