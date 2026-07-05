// Single registry of every tool on the site. Used by the homepage grid,
// the desktop navbar, the mobile tools menu, and the per-tool chrome
// (breadcrumb + related tools) so nothing goes stale in one place.
import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  Presentation,
  ArrowRightLeft,
  Combine,
  Scissors,
  Minimize2,
  ArrowUpFromLine,
  Type,
  RotateCw,
  Droplets,
  Lock,
  Unlock,
  Eraser,
  Highlighter,
  Table,
  FileStack,
  EyeOff,
  Printer,
  Hash,
  Palette,
  ArrowDownUp,
  FilePlus2,
  Crop,
  PenLine,
  ImageDown,
  QrCode,
  Diff,
  FileUser,
  Receipt,
  Award,
  BookOpen,
} from 'lucide-react';

export interface Tool {
  href: string;
  type: 'pdf' | 'image' | 'word' | 'excel' | 'ppt' | 'html' | 'other';
  icon: LucideIcon;
  title: string;
  desc: string;
  cat: string;
  keywords: string;
  badge?: string;
}

export const ALL_TOOLS: Tool[] = [
  // Edit & Annotate
  { href: '/view-pdf',     type: 'pdf',   icon: BookOpen,      title: 'PDF Viewer',       desc: 'Read PDFs, resume where left off', cat: 'Edit & Annotate', keywords: 'view read open pdf viewer reader' },
  { href: '/extract-text', type: 'pdf',   icon: Type,          title: 'Extract Text',     desc: 'Copy text from any PDF', cat: 'Edit & Annotate', keywords: 'extract copy text content' },
  { href: '/annotate',     type: 'pdf',   icon: Highlighter,   title: 'Annotate PDF',     desc: 'Draw, highlight, sign',  cat: 'Edit & Annotate', keywords: 'annotate draw highlight sign', badge: 'New' },
  { href: '/redact',       type: 'pdf',   icon: Eraser,        title: 'Redact PDF',       desc: 'Permanently hide info',  cat: 'Edit & Annotate', keywords: 'redact hide remove text', badge: 'Privacy' },

  // Organize & Manage
  { href: '/merge-pdf',    type: 'pdf',   icon: Combine,       title: 'Merge PDF',        desc: 'Combine multiple files', cat: 'Organize & Manage', keywords: 'merge combine join append' },
  { href: '/split-pdf',    type: 'pdf',   icon: Scissors,      title: 'Split PDF',        desc: 'Extract or split pages', cat: 'Organize & Manage', keywords: 'split separate extract' },
  { href: '/organize',     type: 'pdf',   icon: ArrowUpFromLine, title: 'Organize Pages', desc: 'Reorder, delete, rotate', cat: 'Organize & Manage', keywords: 'organize sort reorder delete' },
  { href: '/rotate-pdf',   type: 'pdf',   icon: RotateCw,      title: 'Rotate PDF',       desc: 'Fix page orientation',   cat: 'Organize & Manage', keywords: 'rotate turn flip' },
  { href: '/compress-pdf', type: 'pdf',   icon: Minimize2,     title: 'Compress PDF',     desc: 'Reduce file size',       cat: 'Organize & Manage', keywords: 'compress shrink optimize' },

  // Convert & Export
  { href: '/pdf-to-word',  type: 'word',  icon: FileText,      title: 'PDF to Word',      desc: 'Convert to Docx',        cat: 'Convert & Export', keywords: 'word docx convert', badge: 'New' },
  { href: '/pdf-to-excel', type: 'excel', icon: Table,         title: 'PDF to Excel',     desc: 'Extract tables to XLSX', cat: 'Convert & Export', keywords: 'excel xlsx table spreadsheet', badge: 'New' },
  { href: '/pdf-to-png',   type: 'image', icon: ImageIcon,     title: 'PDF to JPG/PNG',   desc: 'Save pages as images',   cat: 'Convert & Export', keywords: 'jpg png image photo' },
  { href: '/png-to-pdf',   type: 'image', icon: ImageIcon,     title: 'JPG to PDF',       desc: 'Convert images to PDF',  cat: 'Convert & Export', keywords: 'jpg png image photo' },
  { href: '/print-assistor', type: 'image', icon: Printer,     title: 'Print Assistor',   desc: 'Passport & ID photo prep', cat: 'Convert & Export', keywords: 'print passport visa photo size id card wallet' },
  { href: '/word-to-pdf',  type: 'word',  icon: FileText,      title: 'Word to PDF',      desc: 'Docx to PDF',            cat: 'Convert & Export', keywords: 'word docx' },
  { href: '/excel-to-pdf', type: 'excel', icon: FileSpreadsheet, title: 'Excel to PDF',   desc: 'XLSX to PDF tables',     cat: 'Convert & Export', keywords: 'excel xlsx spreadsheet to pdf', badge: 'New' },
  { href: '/ppt-to-pdf',   type: 'ppt',   icon: Presentation,  title: 'PPT to PDF',       desc: 'PowerPoint to PDF',      cat: 'Convert & Export', keywords: 'ppt pptx powerpoint', badge: 'New' },
  { href: '/md-to-pdf',    type: 'html',  icon: FileCode,      title: 'Markdown to PDF',  desc: 'Convert Code/MD',        cat: 'Convert & Export', keywords: 'markdown md code' },
  { href: '/batch-convert', type: 'pdf',  icon: FileStack,     title: 'Batch Convert',    desc: 'Convert many files at once', cat: 'Convert & Export', keywords: 'batch bulk convert', badge: 'New' },

  // Security & Privacy
  { href: '/protect-pdf',  type: 'pdf',   icon: Lock,          title: 'Protect PDF',      desc: 'Add a password hint',    cat: 'Security & Privacy', keywords: 'protect lock password encrypt hint' },
  { href: '/unlock-pdf',   type: 'pdf',   icon: Unlock,        title: 'Unlock PDF',       desc: 'Remove passwords',       cat: 'Security & Privacy', keywords: 'unlock remove password decrypt', badge: 'New' },
  { href: '/watermark-pdf', type: 'pdf',  icon: Droplets,      title: 'Watermark',        desc: 'Add stamp or text',      cat: 'Security & Privacy', keywords: 'watermark stamp overlay' },
  { href: '/privacy-clean', type: 'pdf',  icon: EyeOff,        title: 'Privacy Cleaner',  desc: 'Remove metadata',        cat: 'Security & Privacy', keywords: 'metadata hidden clean', badge: 'Privacy' },

  // Page Tools
  { href: '/page-numbers', type: 'pdf',   icon: Hash,          title: 'Page Numbers',     desc: 'Add sequential numbers', cat: 'Page Tools', keywords: 'page number header footer' },
  { href: '/reverse-pdf',  type: 'pdf',   icon: ArrowDownUp,   title: 'Reverse Pages',    desc: 'Flip page order',        cat: 'Page Tools', keywords: 'reverse flip order' },
  { href: '/blank-pages',  type: 'pdf',   icon: FilePlus2,     title: 'Add Blank Pages',  desc: 'Insert blank pages',     cat: 'Page Tools', keywords: 'blank insert empty page' },
  { href: '/crop-pdf',     type: 'pdf',   icon: Crop,          title: 'Crop PDF',         desc: 'Trim page margins',      cat: 'Page Tools', keywords: 'crop trim margin whitespace' },
  { href: '/metadata-editor', type: 'pdf', icon: FileText,     title: 'Metadata Editor',  desc: 'View & edit PDF info',   cat: 'Page Tools', keywords: 'metadata title author properties' },
  { href: '/invert',       type: 'pdf',   icon: ArrowRightLeft, title: 'Invert Colors',   desc: 'Dark mode for PDFs',     cat: 'Page Tools', keywords: 'invert dark mode color' },
  { href: '/grayscale',    type: 'pdf',   icon: Palette,       title: 'Grayscale PDF',    desc: 'Convert to B&W',         cat: 'Page Tools', keywords: 'grayscale black white bw' },

  // Sign & Compare
  { href: '/sign-pdf',     type: 'pdf',   icon: PenLine,       title: 'Sign PDF',         desc: 'Draw or type signature', cat: 'Sign & Compare', keywords: 'sign signature draw esign', badge: 'Popular' },
  { href: '/compare-pdf',  type: 'pdf',   icon: Diff,          title: 'Compare PDFs',     desc: 'Side-by-side diff',      cat: 'Sign & Compare', keywords: 'compare diff difference side by side' },

  // Images & More
  { href: '/compress-image', type: 'image', icon: ImageDown,   title: 'Compress Images',  desc: 'Reduce image sizes',     cat: 'Images & More', keywords: 'compress image jpg png webp resize' },
  { href: '/qr-code',      type: 'other', icon: QrCode,        title: 'QR Code',          desc: 'Generate QR codes',      cat: 'Images & More', keywords: 'qr code generate barcode' },
  { href: '/resume-builder', type: 'other', icon: FileUser,    title: 'Resume Builder',   desc: 'Create resume PDF',      cat: 'Images & More', keywords: 'resume cv builder create' },
  { href: '/invoice-generator', type: 'other', icon: Receipt,  title: 'Invoice Generator', desc: 'Create invoices',       cat: 'Images & More', keywords: 'invoice bill receipt generator' },
  { href: '/certificate-generator', type: 'other', icon: Award, title: 'Certificate',     desc: 'Generate certificates',  cat: 'Images & More', keywords: 'certificate award achievement' },
];

export const CATEGORIES = [
  'Organize & Manage',
  'Convert & Export',
  'Edit & Annotate',
  'Security & Privacy',
  'Page Tools',
  'Sign & Compare',
  'Images & More',
];

export function findTool(pathname: string): Tool | undefined {
  return ALL_TOOLS.find(t => t.href === pathname);
}

export function relatedTools(pathname: string, limit = 6): Tool[] {
  const current = findTool(pathname);
  if (!current) return [];
  const sameCat = ALL_TOOLS.filter(t => t.cat === current.cat && t.href !== pathname);
  const others = ALL_TOOLS.filter(t => t.cat !== current.cat && t.href !== pathname);
  return [...sameCat, ...others].slice(0, limit);
}

// Anchor id for a category section on the homepage
export function catId(cat: string): string {
  return 'cat-' + cat.toLowerCase().replace(/[^a-z]+/g, '-');
}
