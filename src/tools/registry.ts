// Every tool on the site, as data. The home index, tool pages, sitemap and
// metadata all read from this list, so a tool exists in exactly one place.

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
  seo: { title: string; description: string };
};

export const TOOLS: ToolMeta[] = [];

export function findTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
