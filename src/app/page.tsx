'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Shield,
  Zap,
  CloudOff,
  Search,
  X,
  RotateCw,
  Droplets,
  Lock,
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
  Sparkles,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import styles from './Home.module.css';

// ── Tool Definitions ──
const ALL_TOOLS = [
  // Edit & Annotate
  { href: '/view-pdf',     type: 'pdf',   icon: BookOpen,      title: 'PDF Viewer',       desc: 'Read PDFs, resume where left off', cat: 'Edit & Annotate', keywords: 'view read open pdf viewer reader' },
  { href: '/extract-text', type: 'pdf',   icon: Type,          title: 'Edit Text',        desc: 'Edit PDF text directly', cat: 'Edit & Annotate', keywords: 'edit text modify content' },
  { href: '/annotate',     type: 'pdf',   icon: Highlighter,   title: 'Annotate PDF',     desc: 'Draw, highlight, sign',  cat: 'Edit & Annotate', keywords: 'annotate draw highlight sign', badge: 'New' },
  { href: '/redact',       type: 'pdf',   icon: Eraser,        title: 'Redact PDF',       desc: 'Permanently hide info',  cat: 'Edit & Annotate', keywords: 'redact hide remove text', badge: 'Privacy' },

  // Organize & Manage
  { href: '/merge-pdf',    type: 'pdf',   icon: Combine,       title: 'Merge PDF',        desc: 'Combine multiple files', cat: 'Organize & Manage', keywords: 'merge combine join append' },
  { href: '/split-pdf',    type: 'pdf',   icon: Scissors,      title: 'Split PDF',        desc: 'Extract or split pages', cat: 'Organize & Manage', keywords: 'split separate extract' },
  { href: '/organize',     type: 'pdf',   icon: ArrowUpFromLine, title: 'Organize Pages', desc: 'Reorder, delete, rotate', cat: 'Organize & Manage', keywords: 'organize sort reorder delete' },
  { href: '/rotate-pdf',   type: 'pdf',   icon: RotateCw,      title: 'Rotate PDF',       desc: 'Fix page orientation',   cat: 'Organize & Manage', keywords: 'rotate turn flip' },

  // Convert & Export
  { href: '/pdf-to-word',  type: 'word',  icon: FileText,      title: 'PDF to Word',      desc: 'Convert to Docx',        cat: 'Convert & Export', keywords: 'word docx convert' },
  { href: '/pdf-to-excel', type: 'excel', icon: Table,         title: 'PDF to Excel',     desc: 'Extract tables to XLSX', cat: 'Convert & Export', keywords: 'excel xlsx table spreadsheet', badge: 'New' },
  { href: '/pdf-to-png',   type: 'image', icon: ImageIcon,     title: 'PDF to JPG/PNG',   desc: 'Save pages as images',   cat: 'Convert & Export', keywords: 'jpg png image photo' },
  { href: '/png-to-pdf',   type: 'image', icon: ImageIcon,     title: 'JPG to PDF',       desc: 'Convert images to PDF',  cat: 'Convert & Export', keywords: 'jpg png image photo' },
  { href: '/print-assistor', type: 'image', icon: Printer,     title: 'Print Assistor',   desc: 'Passport & ID photo prep', cat: 'Convert & Export', keywords: 'print passport visa photo size id card wallet', badge: 'New' },
  { href: '/word-to-pdf',  type: 'word',  icon: FileText,      title: 'Word to PDF',      desc: 'Docx to PDF',            cat: 'Convert & Export', keywords: 'word docx' },
  { href: '/ppt-to-pdf',   type: 'ppt',   icon: Presentation,  title: 'PPT to PDF',       desc: 'PowerPoint to PDF',      cat: 'Convert & Export', keywords: 'ppt pptx powerpoint' },

  // Security & Privacy
  { href: '/protect-pdf',  type: 'pdf',   icon: Lock,          title: 'Protect PDF',      desc: 'Encrypt with password',  cat: 'Security & Privacy', keywords: 'protect lock password encrypt' },
  { href: '/unlock-pdf',   type: 'pdf',   icon: Lock,          title: 'Unlock PDF',       desc: 'Remove passwords',       cat: 'Security & Privacy', keywords: 'unlock remove password decrypt' },
  { href: '/watermark-pdf', type: 'pdf',  icon: Droplets,      title: 'Watermark',        desc: 'Add stamp or text',      cat: 'Security & Privacy', keywords: 'watermark stamp overlay' },
  { href: '/privacy-clean', type: 'pdf',  icon: EyeOff,        title: 'Privacy Cleaner',  desc: 'Remove metadata',        cat: 'Security & Privacy', keywords: 'metadata hidden clean', badge: 'Privacy' },

  // Batch Tools
  { href: '/compress-pdf', type: 'pdf',   icon: Minimize2,     title: 'Compress PDF',     desc: 'Reduce file size',       cat: 'Batch Tools', keywords: 'compress shrink optimize' },
  { href: '/batch-convert', type: 'pdf',  icon: FileStack,     title: 'Batch Convert',    desc: 'Process multiple files', cat: 'Batch Tools', keywords: 'batch bulk convert', badge: 'Pro' },
  { href: '/invert',       type: 'pdf',   icon: ArrowRightLeft, title: 'Invert Colors',   desc: 'Dark mode for PDFs',     cat: 'Batch Tools', keywords: 'invert dark mode color' },
  { href: '/md-to-pdf',    type: 'html',  icon: FileCode,      title: 'Markdown to PDF',  desc: 'Convert Code/MD',        cat: 'Batch Tools', keywords: 'markdown md code' },
  { href: '/grayscale',    type: 'pdf',   icon: Palette,       title: 'Grayscale PDF',    desc: 'Convert to B&W',         cat: 'Batch Tools', keywords: 'grayscale black white bw' },

  // Page Tools
  { href: '/page-numbers', type: 'pdf',   icon: Hash,          title: 'Page Numbers',     desc: 'Add sequential numbers', cat: 'Page Tools', keywords: 'page number header footer', badge: 'New' },
  { href: '/reverse-pdf',  type: 'pdf',   icon: ArrowDownUp,   title: 'Reverse Pages',    desc: 'Flip page order',        cat: 'Page Tools', keywords: 'reverse flip order' },
  { href: '/blank-pages',  type: 'pdf',   icon: FilePlus2,     title: 'Add Blank Pages',  desc: 'Insert blank pages',     cat: 'Page Tools', keywords: 'blank insert empty page' },
  { href: '/crop-pdf',     type: 'pdf',   icon: Crop,          title: 'Crop PDF',         desc: 'Trim page margins',      cat: 'Page Tools', keywords: 'crop trim margin whitespace' },
  { href: '/metadata-editor', type: 'pdf', icon: FileText,     title: 'Metadata Editor',  desc: 'View & edit PDF info',   cat: 'Page Tools', keywords: 'metadata title author properties' },

  // Sign & Create
  { href: '/sign-pdf',     type: 'pdf',   icon: PenLine,       title: 'Sign PDF',         desc: 'Draw or type signature', cat: 'Sign & Create', keywords: 'sign signature draw esign', badge: 'Popular' },
  { href: '/compare-pdf',  type: 'pdf',   icon: Diff,          title: 'Compare PDFs',     desc: 'Side-by-side diff',      cat: 'Sign & Create', keywords: 'compare diff difference side by side' },

  // Image Tools
  { href: '/compress-image', type: 'image', icon: ImageDown,   title: 'Compress Images',  desc: 'Reduce image sizes',     cat: 'Image Tools', keywords: 'compress image jpg png webp resize', badge: 'New' },
  { href: '/qr-code',      type: 'other', icon: QrCode,        title: 'QR Code',          desc: 'Generate QR codes',      cat: 'Image Tools', keywords: 'qr code generate barcode' },

  // Generators
  { href: '/resume-builder', type: 'other', icon: FileUser,    title: 'Resume Builder',   desc: 'Create resume PDF',      cat: 'Generators', keywords: 'resume cv builder create', badge: 'New' },
  { href: '/invoice-generator', type: 'other', icon: Receipt,  title: 'Invoice Generator', desc: 'Create invoices',       cat: 'Generators', keywords: 'invoice bill receipt generator' },
  { href: '/certificate-generator', type: 'other', icon: Award, title: 'Certificate',     desc: 'Generate certificates',  cat: 'Generators', keywords: 'certificate award achievement' },
] as const;

type Tool = (typeof ALL_TOOLS)[number] & { badge?: string };

const CATEGORIES = [
  'Edit & Annotate',
  'Organize & Manage',
  'Convert & Export',
  'Security & Privacy',
  'Batch Tools',
  'Page Tools',
  'Sign & Create',
  'Image Tools',
  'Generators',
];

const FEATURED_HREFS = ['/merge-pdf', '/sign-pdf', '/compress-pdf', '/pdf-to-png'];
const FEATURED = FEATURED_HREFS
  .map(href => ALL_TOOLS.find(t => t.href === href))
  .filter(Boolean) as Tool[];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const filtered = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return (ALL_TOOLS as unknown as Tool[]).filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.keywords.includes(q)
      );
    }
    if (activeTab === 'All') return ALL_TOOLS as unknown as Tool[];
    return (ALL_TOOLS as unknown as Tool[]).filter(t => t.cat === activeTab);
  }, [query, activeTab]);

  const isSearching = query.trim().length > 0;

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>

          <div className={styles.heroPill}>
            <Sparkles size={12} />
            40+ free tools · No sign-up required
          </div>

          <h1 className={styles.heroTitle}>
            Every PDF tool<br />
            <span className={styles.heroAccent}>you&apos;ll ever need.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Merge, split, compress, convert, sign, and more.
            Everything runs in your browser — your files never leave your device.
          </p>

          <div className={styles.searchWrap}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search 40+ tools... e.g. merge, compress, sign"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className={styles.searchClear} onClick={() => setQuery('')} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </div>

          <div className={styles.trustRow}>
            <span className={styles.trustItem}><Shield size={13} /> Privacy first</span>
            <span className={styles.trustDot} />
            <span className={styles.trustItem}><Zap size={13} /> Instant results</span>
            <span className={styles.trustDot} />
            <span className={styles.trustItem}><CloudOff size={13} /> No uploads</span>
            <span className={styles.trustDot} />
            <span className={styles.trustItem}><Sparkles size={13} /> Always free</span>
          </div>

        </div>
      </section>

      {/* ── Featured Tools ── */}
      {!isSearching && (
        <section className={styles.featuredSection}>
          <div className={styles.wrapper}>
            <p className={styles.sectionLabel}>Most popular</p>
            <div className={styles.featuredGrid}>
              {FEATURED.map(tool => (
                <Link href={tool.href} key={tool.href} className={styles.featuredCard}>
                  <div className={styles.featuredIconWrap} data-type={tool.type}>
                    <tool.icon size={22} />
                  </div>
                  <div className={styles.featuredInfo}>
                    <div className={styles.featuredTitle}>{tool.title}</div>
                    <div className={styles.featuredDesc}>{tool.desc}</div>
                  </div>
                  <ChevronRight size={16} className={styles.featuredArrow} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── All Tools ── */}
      <section className={styles.toolsSection}>
        <div className={styles.wrapper}>

          <div className={styles.toolsHeader}>
            <h2 className={styles.toolsTitle}>
              {isSearching
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`
                : 'All Tools'}
            </h2>
            {!isSearching && (
              <div className={styles.tabsScroll}>
                <div className={styles.tabs}>
                  {['All', ...CATEGORIES].map(cat => (
                    <button
                      key={cat}
                      className={`${styles.tab} ${activeTab === cat ? styles.tabActive : ''}`}
                      onClick={() => setActiveTab(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className={styles.toolGrid}>
              {filtered.map(tool => (
                <Link href={tool.href} key={tool.href} className={styles.toolCard} data-type={tool.type}>
                  <div className={styles.toolIcon}>
                    <tool.icon size={18} />
                  </div>
                  <div className={styles.toolBody}>
                    <span className={styles.toolName}>{tool.title}</span>
                    <span className={styles.toolDesc}>{tool.desc}</span>
                  </div>
                  {'badge' in tool && tool.badge && (
                    <span className={styles.badge}>{tool.badge}</span>
                  )}
                  <ArrowRight size={14} className={styles.toolArrow} />
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              No tools found for &quot;{query}&quot;. Try &ldquo;merge&rdquo;, &ldquo;sign&rdquo;, or &ldquo;compress&rdquo;.
            </p>
          )}

        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className={styles.footerCta}>
        <div className={styles.footerCtaInner}>
          <p className={styles.footerCtaTitle}>
            All tools are <span className={styles.heroAccent}>free, forever.</span>
          </p>
          <p className={styles.footerCtaSub}>
            No account. No file size limit. No watermarks. Built for privacy.
          </p>
        </div>
      </section>

    </div>
  );
}
