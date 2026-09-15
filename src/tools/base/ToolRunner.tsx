"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "./Dropzone";
import { loadPdfLib } from "./engines";
import { FileList, initialStatus, type FileStatus } from "./FileList";
import { FILE_KINDS, matchesKind, toToolFiles, type ToolFile, type ToolInput } from "./files";
import { PasswordError } from "./pdf";
import { Results } from "./Results";
import type { AnyToolDefinition, ToolOutput } from "./types";

type Phase = { name: "ready" } | { name: "working"; done: number; total: number } | { name: "done"; outputs: ToolOutput[] };

type ToolRunnerProps = {
  input: ToolInput;
  /** Null while the tool's code is still loading; files can be added meanwhile. */
  definition: AnyToolDefinition | null;
  zipName: string;
};

export function ToolRunner({ input, definition, zipName }: ToolRunnerProps) {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [statuses, setStatuses] = useState<Record<string, FileStatus>>({});
  const [chosenOptions, setOptions] = useState<unknown>();
  const [phase, setPhase] = useState<Phase>({ name: "ready" });
  const [notice, setNotice] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ files: ToolFile[]; options: unknown; message: string | null }>();
  const controller = useRef<AbortController | null>(null);

  const options = chosenOptions ?? definition?.defaults;
  const working = phase.name === "working";

  const addFiles = useCallback(
    (incoming: File[]) => {
      const accepted = incoming.filter((file) => matchesKind(file, input.accept));
      const skipped = incoming.length - accepted.length;
      setNotice(
        skipped > 0
          ? `${skipped} file${skipped === 1 ? " was" : "s were"} skipped. This tool takes ${FILE_KINDS[input.accept].many}.`
          : null,
      );
      if (accepted.length === 0) return;
      const added = toToolFiles(input.multiple ? accepted : accepted.slice(0, 1));
      setFiles((current) => (input.multiple ? [...current, ...added] : added));
      setPhase({ name: "ready" });
    },
    [input],
  );

  // Warm up the PDF engine while the user looks over their files, so the click feels instant.
  const hasFiles = files.length > 0;
  useEffect(() => {
    if (!hasFiles || input.accept === "docx" || input.accept === "xlsx" || input.accept === "pptx") return;
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 200));
    idle(() => void loadPdfLib());
  }, [hasFiles, input.accept]);

  // Validation can be async (some tools read the PDF), so each result is kept with the inputs it checked.
  const needsCheck = Boolean(definition?.validate) && files.length > 0;
  useEffect(() => {
    if (!definition?.validate || files.length === 0) return;
    let current = true;
    Promise.resolve(definition.validate(files, options)).then((message) => {
      if (current) setChecked({ files, options, message });
    });
    return () => {
      current = false;
    };
  }, [definition, files, options]);
  const checkIsCurrent = checked?.files === files && checked.options === options;
  const validation = needsCheck && checkIsCurrent ? checked.message : null;
  const checking = needsCheck && !checkIsCurrent;

  const onStatus = useCallback((id: string, status: FileStatus) => {
    setStatuses((current) => ({ ...current, [id]: status }));
  }, []);

  function moveFile(id: string, offset: -1 | 1) {
    setPhase({ name: "ready" });
    setFiles((current) => {
      const index = current.findIndex((file) => file.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
    setPhase({ name: "ready" });
  }

  function setPassword(id: string, password: string) {
    setPhase({ name: "ready" });
    setFiles((current) => current.map((file) => (file.id === id ? { ...file, password } : file)));
  }

  function startOver() {
    controller.current?.abort();
    setFiles([]);
    setStatuses({});
    setNotice(null);
    setPhase({ name: "ready" });
  }

  async function run() {
    if (!definition) return;
    const abort = new AbortController();
    controller.current = abort;
    setNotice(null);
    setPhase({ name: "working", done: 0, total: 0 });
    try {
      const outputs = await definition.run(files, options, {
        signal: abort.signal,
        progress: (done, total) => {
          if (!abort.signal.aborted) setPhase({ name: "working", done, total });
        },
      });
      if (!abort.signal.aborted) setPhase({ name: "done", outputs });
    } catch (error) {
      setPhase({ name: "ready" });
      if (abort.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
      if (error instanceof PasswordError) {
        onStatus(error.fileId, { state: "locked", wrong: error.wrong });
        return;
      }
      console.error(error);
      setNotice(error instanceof Error ? error.message : "Something stopped the tool from finishing. Try again.");
    }
  }

  const blocked = files.some((file) => {
    const state = (statuses[file.id] ?? initialStatus(file)).state;
    return state === "locked" || state === "broken" || state === "reading";
  });
  const enoughFiles = files.length >= (definition?.minFiles ?? 1);
  const canRun = Boolean(definition) && enoughFiles && !blocked && !checking && !validation && !working;

  if (files.length === 0) {
    return (
      <div className="runner">
        <Dropzone {...input} onFiles={addFiles} />
        {notice && (
          <p className="notice" role="alert">
            {notice}
          </p>
        )}
      </div>
    );
  }

  const OptionsForm = definition?.Options;

  return (
    <div className="runner workbench">
      <div className="stage">
        <FileList
          files={files}
          statuses={statuses}
          reorderable={input.multiple}
          disabled={working}
          onStatus={onStatus}
          onMove={moveFile}
          onRemove={removeFile}
          onPassword={setPassword}
        />
        {input.multiple && phase.name === "ready" && <Dropzone {...input} compact onFiles={addFiles} />}
      </div>

      <aside className="panel" aria-label="Options">
        {phase.name === "done" ? (
          <Results
            outputs={phase.outputs}
            zipName={zipName}
            onBack={OptionsForm ? () => setPhase({ name: "ready" }) : undefined}
            onStartOver={startOver}
          />
        ) : (
          <>
            {OptionsForm && (
              <fieldset className="options" disabled={working}>
                <OptionsForm files={files} options={options} setOptions={setOptions} />
              </fieldset>
            )}

            {!enoughFiles && definition?.minFiles && (
              <p className="field-hint">Add at least {definition.minFiles} files.</p>
            )}
            {validation && <p className="field-error">{validation}</p>}
            {notice && (
              <p className="notice" role="alert">
                {notice}
              </p>
            )}

            {working ? (
              <div className="progress" aria-live="polite">
                <progress max={phase.total || undefined} value={phase.total ? phase.done : undefined} />
                <div className="progress-row">
                  <span>{phase.total ? `${Math.round((phase.done / phase.total) * 100)}%` : "Working…"}</span>
                  <button type="button" className="link-button" onClick={() => controller.current?.abort()}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-primary btn-block" disabled={!canRun} onClick={run}>
                {definition ? definition.actionLabel(files, options) : "Loading…"}
              </button>
            )}

            {!working && (
              <div className="panel-links">
                <button type="button" className="link-button" onClick={startOver}>
                  Start over
                </button>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
