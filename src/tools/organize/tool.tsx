"use client";

import { useEffect, useState } from "react";
import { loadPdfLib } from "../base/engines";
import { outputName, type ToolFile } from "../base/files";
import { PageThumb } from "../base/PageThumb";
import { openPdf, savePdf } from "../base/pdf";
import { defineTool, throwIfCancelled, type WorkspaceProps } from "../base/types";
import { usePdfDocument } from "../base/usePdfDocument";

type Item = { key: string; source: number | null; rotation: number };
type Options = { items: Item[]; forFile?: ToolFile };

const TILE_WIDTH = 132;

function freshItems(count: number): Item[] {
  return Array.from({ length: count }, (_, index) => ({ key: `page-${index}`, source: index, rotation: 0 }));
}

function OrganizeWorkspace({ files, options, setOptions, disabled }: WorkspaceProps<Options>) {
  const file = files[0];
  const doc = usePdfDocument(file);
  const [dragging, setDragging] = useState<string | null>(null);

  const ready = doc && "pdf" in doc ? doc : null;

  useEffect(() => {
    if (ready && options.forFile !== file) setOptions({ forFile: file, items: freshItems(ready.sizes.length) });
  }, [ready, file, options.forFile, setOptions]);

  if (doc && "error" in doc) return <p className="field-error">{doc.error}</p>;
  if (!ready || options.forFile !== file) return <p className="muted">Reading pages…</p>;

  const items = options.items;
  const update = (next: Item[]) => setOptions({ ...options, items: next });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update(next);
  };
  const blankSize = (position: number) => {
    const near = items.slice(0, position + 1).reverse().find((item) => item.source !== null);
    return ready.sizes[near?.source ?? 0];
  };

  return (
    <div className="organize">
      <div className="workspace-toolbar">
        <p className="muted">
          {items.length} page{items.length === 1 ? "" : "s"}. Drag pages to reorder them.
        </p>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-quiet" disabled={disabled} onClick={() => update([...items].reverse())}>
            Reverse order
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={disabled}
            onClick={() => update(items.map((item) => ({ ...item, rotation: (item.rotation + 90) % 360 })))}
          >
            Rotate all
          </button>
          <button type="button" className="link-button" disabled={disabled} onClick={() => update(freshItems(ready.sizes.length))}>
            Reset
          </button>
        </div>
      </div>

      <ol className="page-grid">
        {items.map((item, position) => (
          <li
            key={item.key}
            className={`page-tile${dragging === item.key ? " is-dragging" : ""}`}
            draggable={!disabled}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              setDragging(item.key);
            }}
            onDragEnd={() => setDragging(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const from = items.findIndex((entry) => entry.key === dragging);
              if (from >= 0) move(from, position);
              setDragging(null);
            }}
          >
            {item.source === null ? (
              <div
                className="page-thumb is-blank"
                style={{ width: TILE_WIDTH, height: Math.round((TILE_WIDTH * blankSize(position).height) / blankSize(position).width) }}
              >
                Blank
              </div>
            ) : (
              <PageThumb
                pdf={ready.pdf}
                index={item.source}
                size={ready.sizes[item.source]}
                width={TILE_WIDTH}
                rotation={item.rotation}
              />
            )}
            <div className="tile-bar">
              <span className="tile-number">{position + 1}</span>
              <TileButton label={`Move page ${position + 1} earlier`} disabled={disabled || position === 0} onClick={() => move(position, position - 1)}>
                <path d="M10 3 5 8l5 5" />
              </TileButton>
              <TileButton
                label={`Move page ${position + 1} later`}
                disabled={disabled || position === items.length - 1}
                onClick={() => move(position, position + 1)}
              >
                <path d="m6 3 5 5-5 5" />
              </TileButton>
              <TileButton
                label={`Rotate page ${position + 1}`}
                disabled={disabled || item.source === null}
                onClick={() =>
                  update(items.map((entry) => (entry.key === item.key ? { ...entry, rotation: (entry.rotation + 90) % 360 } : entry)))
                }
              >
                <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" />
              </TileButton>
              <TileButton
                label={`Delete page ${position + 1}`}
                disabled={disabled || items.length === 1}
                onClick={() => update(items.filter((entry) => entry.key !== item.key))}
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </TileButton>
            </div>
            <button
              type="button"
              className="insert-blank"
              disabled={disabled}
              onClick={() => {
                const next = [...items];
                next.splice(position + 1, 0, { key: `blank-${crypto.randomUUID()}`, source: null, rotation: 0 });
                update(next);
              }}
            >
              Add blank page after
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TileButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="icon-button" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

export default defineTool<Options>({
  defaults: { items: [] },
  Workspace: OrganizeWorkspace,
  actionLabel: (_files, options) => (options.items.length ? `Save ${options.items.length}-page PDF` : "Save PDF"),
  validate: (files, options) => (options.forFile !== files[0] ? "Reading pages…" : null),

  async run(files, options, { progress, signal }) {
    const { PDFDocument, degrees } = await loadPdfLib();
    const source = await openPdf(files[0]);
    const output = await PDFDocument.create();
    const sourcePages = source.getPages();

    for (const [position, item] of options.items.entries()) {
      throwIfCancelled(signal);
      if (item.source === null) {
        const previous = output.getPageCount() > 0 ? output.getPage(output.getPageCount() - 1) : sourcePages[0];
        const { width, height } = previous.getSize();
        output.addPage([width, height]);
      } else {
        const [page] = await output.copyPages(source, [item.source]);
        page.setRotation(degrees((sourcePages[item.source].getRotation().angle + item.rotation) % 360));
        output.addPage(page);
      }
      progress(position + 1, options.items.length);
    }

    return [{ name: outputName(files[0].file.name, "-organized", "pdf"), blob: await savePdf(output) }];
  },
});
