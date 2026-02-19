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
  Lock
} from 'lucide-react';
import styles from './Home.module.css';
import Logo from './components/Logo';
import AdSlot from './components/AdSlot';

// All tools in one flat list for search
const ALL_TOOLS = [
  { href: '/png-to-pdf',   type: 'image', icon: ImageIcon,        title: 'JPG to PDF',        desc: 'Images → PDF',       cat: 'Convert to PDF',    keywords: 'jpg jpeg png image photo picture convert' },
  { href: '/word-to-pdf',  type: 'word',  icon: FileText,         title: 'WORD to PDF',       desc: 'Docx → PDF',         cat: 'Convert to PDF',    keywords: 'word docx document office microsoft' },
  { href: '/ppt-to-pdf',   type: 'ppt',   icon: Presentation,     title: 'PPT to PDF',        desc: 'Slides → PDF',       cat: 'Convert to PDF',    keywords: 'powerpoint ppt pptx slides presentation',   badge: 'Soon' },
  { href: '/excel-to-pdf', type: 'excel', icon: FileSpreadsheet,  title: 'EXCEL to PDF',      desc: 'Sheets → PDF',       cat: 'Convert to PDF',    keywords: 'excel xlsx spreadsheet table data',         badge: 'Soon' },
  { href: '/md-to-pdf',    type: 'html',  icon: FileCode,         title: 'Markdown to PDF',   desc: 'MD / HTML → PDF',    cat: 'Convert to PDF',    keywords: 'markdown md html code readme notes blog' },
  { href: '/pdf-to-png',   type: 'image', icon: ImageIcon,        title: 'PDF to JPG',        desc: 'Pages as images',    cat: 'Convert from PDF',  keywords: 'pdf jpg image extract render screenshot' },
  { href: '/extract-text', type: 'pdf',   icon: Type,             title: 'PDF to Text',       desc: 'Extract raw text',   cat: 'Convert from PDF',  keywords: 'text extract copy ocr content' },
  { href: '/pdf-to-word',  type: 'word',  icon: FileText,         title: 'PDF to WORD',       desc: 'PDF → Docx',         cat: 'Convert from PDF',  keywords: 'word docx editable document',               badge: 'Soon' },
  { href: '/merge-pdf',    type: 'pdf',   icon: Combine,          title: 'Merge PDF',         desc: 'Combine files',      cat: 'Edit & Organize',   keywords: 'merge combine join append concatenate' },
  { href: '/split-pdf',    type: 'pdf',   icon: Scissors,         title: 'Split PDF',         desc: 'Extract pages',      cat: 'Edit & Organize',   keywords: 'split separate extract page range' },
  { href: '/compress-pdf', type: 'pdf',   icon: Minimize2,        title: 'Compress PDF',      desc: 'Reduce size',        cat: 'Edit & Organize',   keywords: 'compress reduce shrink optimize size' },
  { href: '/rotate-pdf',   type: 'pdf',   icon: RotateCw,         title: 'Rotate PDF',        desc: 'Rotate pages',       cat: 'Edit & Organize',   keywords: 'rotate turn flip page orientation angle' },
  { href: '/watermark-pdf', type: 'pdf',  icon: Droplets,         title: 'Watermark PDF',     desc: 'Stamp text',         cat: 'Edit & Organize',   keywords: 'watermark stamp text overlay confidential' },
  { href: '/protect-pdf',  type: 'pdf',   icon: Lock,             title: 'Protect PDF',       desc: 'Password protect',   cat: 'Edit & Organize',   keywords: 'protect password lock encrypt secure' },
  { href: '/organize',     type: 'pdf',   icon: ArrowUpFromLine,  title: 'Organize PDF',      desc: 'Reorder pages',      cat: 'Edit & Organize',   keywords: 'organize reorder rearrange sort delete page' },
  { href: '/invert',       type: 'pdf',   icon: ArrowRightLeft,   title: 'Invert PDF',        desc: 'Dark mode PDFs',     cat: 'Edit & Organize',   keywords: 'invert dark mode night color reverse' },
];

const CATEGORIES = ['Convert to PDF', 'Convert from PDF', 'Edit & Organize'];

export default function HomePage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return null; // null → show default grouped view
    const q = query.toLowerCase();
    return ALL_TOOLS.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.keywords.includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof ALL_TOOLS> = {};
    CATEGORIES.forEach(c => { map[c] = ALL_TOOLS.filter(t => t.cat === c); });
    return map;
  }, []);

  return (
    <div className="page-container">
      <section className={styles.hero}>
        
        {/* Logo */}
        <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Logo size={56} />
        </div>

        {/* Headline */}
        <h1 className={`${styles.heroTitle} animate-in animate-delay-1`}>
          Your PDFs,<br /><span className="gradient-text">your device.</span>
        </h1>

        <p className={`${styles.heroSubtitle} animate-in animate-delay-2`}>
          Fast, private PDF tools that run entirely in your browser. Nothing is uploaded. Ever.
        </p>

        {/* Search */}
        <div className={`${styles.searchWrapper} animate-in animate-delay-3`}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search tools… e.g. merge, split, jpg"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.searchClear} onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Trust bar */}
        <div className={`${styles.trustBar} animate-in animate-delay-3`}>
          <div className={styles.trustItem}>
            <Shield size={14} className={styles.trustIcon} />
            100% Client-Side
          </div>
          <div className={styles.trustItem}>
            <Zap size={14} className={styles.trustIcon} />
            Instant Processing
          </div>
          <div className={styles.trustItem}>
            <CloudOff size={14} className={styles.trustIcon} />
            No Server Uploads
          </div>
        </div>

        {/* ── Ad Slot: Top Banner ── */}
        <AdSlot slot="1234567890" format="horizontal" className={styles.adBanner} />

        {/* Tool Grid */}
        <div className={`${styles.gridContainer} animate-in animate-delay-4`}>

          {filtered !== null ? (
            /* ── Search Results ── */
            <div className={styles.categorySection}>
              <div className={styles.categoryLabel}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
              </div>
              {filtered.length > 0 ? (
                <div className={styles.toolGrid}>
                  {filtered.map(t => <ToolCard key={t.href} tool={t} />)}
                </div>
              ) : (
                <div className={styles.emptySearch}>
                  No tools match your search. Try "merge", "split", or "jpg".
                </div>
              )}
            </div>
          ) : (
            /* ── Default Grouped View ── */
            <>
              {CATEGORIES.map((cat, ci) => (
                <div key={cat}>
                  <div className={styles.categorySection}>
                    <div className={styles.categoryLabel}>{cat}</div>
                    <div className={styles.toolGrid}>
                      {grouped[cat].map(t => <ToolCard key={t.href} tool={t} />)}
                    </div>
                  </div>
                  
                  {/* ── Ad Slot: Between Categories ── */}
                  {ci === 0 && <AdSlot slot="2345678901" format="auto" className={styles.adInline} />}
                </div>
              ))}
            </>
          )}

        </div>

        {/* ── Ad Slot: Bottom Banner ── */}
        <AdSlot slot="3456789012" format="horizontal" className={styles.adBanner} />

      </section>
    </div>
  );
}

/* ── Extracted Tool Card ── */
function ToolCard({ tool }: { tool: typeof ALL_TOOLS[number] }) {
  const Icon = tool.icon;
  return (
    <Link href={tool.href} className={styles.toolCard} data-type={tool.type}>
      <div className={styles.toolIconWrapper}><Icon size={20} /></div>
      <div className={styles.toolInfo}>
        <div className={styles.toolTitle}>{tool.title}</div>
        <div className={styles.toolDesc}>{tool.desc}</div>
      </div>
      {tool.badge && <span className={styles.newBadge}>{tool.badge}</span>}
    </Link>
  );
}
