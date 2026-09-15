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
  {
    slug: "split-pdf",
    name: "Split PDF",
    summary: "Pull out pages or split into files",
    description: "Pull out the pages you need, or split a PDF into several smaller files.",
    category: "organize",
    input: { accept: "pdf", multiple: false },
    zipName: "split-pages.zip",
    seo: {
      title: "Split PDF and extract pages for free",
      description:
        "Extract pages from a PDF or split it by ranges, every page or every few pages. Free, private, and nothing is uploaded.",
    },
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    summary: "Make a PDF smaller",
    description: "Make a PDF smaller by shrinking the images inside it. Text stays sharp.",
    category: "organize",
    input: { accept: "pdf", multiple: false },
    zipName: "compressed.zip",
    seo: {
      title: "Compress PDF to reduce file size for free",
      description:
        "Shrink PDF files for email and uploads by compressing their images, right in your browser. Free, and nothing is uploaded.",
    },
  },
  {
    slug: "pdf-to-png",
    name: "PDF to JPG",
    summary: "Save pages as JPG or PNG images",
    description: "Save PDF pages as JPG or PNG images, at screen or print resolution.",
    category: "convert",
    input: { accept: "pdf", multiple: false },
    zipName: "pages.zip",
    seo: {
      title: "PDF to JPG and PNG converter, free",
      description:
        "Convert PDF pages to high-quality JPG or PNG images in your browser. Pick the pages and resolution. Nothing is uploaded.",
    },
  },
  {
    slug: "png-to-pdf",
    name: "JPG to PDF",
    summary: "Turn photos and images into a PDF",
    description: "Turn JPG, PNG or WebP images into one PDF, one image per page.",
    category: "convert",
    input: { accept: "image", multiple: true },
    zipName: "images.zip",
    seo: {
      title: "JPG to PDF: convert images to PDF for free",
      description:
        "Combine JPG, PNG and WebP images into a single PDF in the order you choose. Phone photos stay the right way up. Nothing is uploaded.",
    },
  },
  {
    slug: "protect-pdf",
    name: "Protect PDF",
    summary: "Add a password to a PDF",
    description: "Lock a PDF with a password, using AES-256 encryption.",
    category: "protect",
    input: { accept: "pdf", multiple: false },
    zipName: "protected.zip",
    seo: {
      title: "Password protect a PDF for free",
      description:
        "Encrypt a PDF with a password using AES-256, and optionally block printing or copying. Done in your browser, nothing is uploaded.",
    },
  },
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    summary: "Remove a password you know",
    description: "Remove the password and restrictions from a PDF you're allowed to open.",
    category: "protect",
    input: { accept: "pdf", multiple: false },
    zipName: "unlocked.zip",
    seo: {
      title: "Unlock PDF and remove its password for free",
      description:
        "Remove the password or printing and copying restrictions from your PDF, with the password you know. Nothing is uploaded.",
    },
  },
  {
    slug: "watermark-pdf",
    name: "Watermark PDF",
    summary: "Stamp text across every page",
    description: "Stamp text such as CONFIDENTIAL or DRAFT across every page.",
    category: "edit",
    input: { accept: "pdf", multiple: false },
    zipName: "watermarked.zip",
    seo: {
      title: "Add a watermark to PDF for free",
      description:
        "Stamp CONFIDENTIAL, DRAFT or your own text across PDF pages, with size, opacity and color controls. Nothing is uploaded.",
    },
  },
];

export function findTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
