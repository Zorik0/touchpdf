// Every tool on the site, as data. The home index, tool pages, sitemap and
// metadata all read from this list, so a tool exists in exactly one place.
// What a tool does lives in src/tools/<slug>/tool.ts, loaded via loaders.ts.

import type { ToolInput } from "./base/files";

export type CategoryId = "organize" | "convert" | "edit" | "protect";

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "organize", name: "Organize" },
  { id: "convert", name: "Convert" },
  { id: "edit", name: "Edit and sign" },
  { id: "protect", name: "Protect" },
];

export type ToolMeta = {
  slug: string;
  name: string;
  /** One short line for the tool index. */
  summary: string;
  /** The sentence under the tool's heading. */
  description: string;
  category: CategoryId;
  input: ToolInput;
  /** File name used when several results download together. */
  zipName: string;
  seo: { title: string; description: string };
};

export const TOOLS: ToolMeta[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    summary: "Combine PDFs into one file",
    description: "Combine several PDFs into one file, in the order you choose.",
    category: "organize",
    input: { accept: "pdf", multiple: true },
    zipName: "merged.zip",
    seo: {
      title: "Merge PDF files for free",
      description:
        "Combine PDF files into one document in the order you choose. Free, no sign-up, and your files never leave your device.",
    },
  },
];

export function findTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
