import type { AnyToolDefinition } from "./base/types";

type ToolLoader = () => Promise<{ default: AnyToolDefinition }>;

/** Each tool's code is its own chunk, fetched only on that tool's page. */
export const TOOL_LOADERS: Record<string, ToolLoader> = {
  "merge-pdf": () => import("./merge-pdf/tool"),
};
