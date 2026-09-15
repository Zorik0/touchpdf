"use client";

import { useId, useState } from "react";
import { acceptAttribute, FILE_KINDS, type ToolInput } from "./files";

type DropzoneProps = ToolInput & {
  onFiles: (files: File[]) => void;
  /** A slim "add more" strip, shown under a file list. */
  compact?: boolean;
};

export function Dropzone({ accept, multiple, onFiles, compact = false }: DropzoneProps) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const kind = FILE_KINDS[accept];

  return (
    <div
      className={`dropzone${compact ? " is-compact" : ""}${dragging ? " is-dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files.length > 0) onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        id={inputId}
        type="file"
        className="visually-hidden"
        accept={acceptAttribute(accept)}
        multiple={multiple}
        onChange={(event) => {
          if (event.target.files?.length) onFiles(Array.from(event.target.files));
          event.target.value = "";
        }}
      />
      {compact ? (
        <label htmlFor={inputId} className="btn btn-quiet">
          Add more {kind.many}
        </label>
      ) : (
        <>
          <p className="dropzone-title">Drop {multiple ? kind.many : kind.one} here</p>
          <label htmlFor={inputId} className="btn btn-primary">
            Choose {multiple ? "files" : "file"}
          </label>
        </>
      )}
    </div>
  );
}
