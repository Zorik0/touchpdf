import type { ComponentType } from "react";
import type { ToolFile } from "./files";

export type ToolOutput = {
  name: string;
  blob: Blob;
  /** A short line about the result, e.g. "62% smaller". */
  note?: string;
};

export type RunContext = {
  /** Report progress, e.g. progress(3, 12) while on page 3 of 12. */
  progress: (done: number, total: number) => void;
  signal: AbortSignal;
};

export type OptionsProps<Options> = {
  files: ToolFile[];
  options: Options;
  setOptions: (next: Options) => void;
};

/**
 * The base module's contract. A tool only describes its options and what it
 * does to the files; picking files, passwords, progress, errors and downloads
 * are handled by the ToolRunner for every tool the same way.
 */
export type ToolDefinition<Options> = {
  defaults: Options;
  /** Fewest files the tool needs. Defaults to 1. */
  minFiles?: number;
  Options?: ComponentType<OptionsProps<Options>>;
  /** Names the main button after what it does, e.g. "Merge 3 PDFs". */
  actionLabel: (files: ToolFile[], options: Options) => string;
  /** Explains what's missing before the tool can run, or returns null. */
  validate?: (files: ToolFile[], options: Options) => Promise<string | null> | string | null;
  run: (files: ToolFile[], options: Options, context: RunContext) => Promise<ToolOutput[]>;
};

// The runner works with any tool's options, which it only passes back to that tool.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any>;

export function defineTool<Options>(definition: ToolDefinition<Options>): ToolDefinition<Options> {
  return definition;
}

/** Stops a run between steps when the user cancels. */
export function throwIfCancelled(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
}
