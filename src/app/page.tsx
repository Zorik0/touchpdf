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
  Eraser,       // Redaction
  Highlighter,  // Annotation (using Highlighter as proxy for Pen/Annotation)
  Table,        // PDF to Excel
  FileStack,    // Batch tools
  EyeOff        // Privacy cleaner
} from 'lucide-react';
import styles from './Home.module.css';
import Logo from './components/Logo';
import AdSlot from './components/AdSlot';
import ToolCard from './components/ToolCard';
import FeatureGrid from './components/FeatureGrid';
import TrustBar from './components/TrustBar';
import VisualProof from './components/VisualProof';

// ── Tool Definitions ──
// Grouped by categories as per the new "Feature-First" design
const ALL_TOOLS = [
  // Edit & Annotate
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
  { href: '/word-to-pdf',  type: 'word',  icon: FileText,      title: 'Word to PDF',      desc: 'Docx to PDF',            cat: 'Convert & Export', keywords: 'word docx' },
  { href: '/ppt-to-pdf',   type: 'ppt',   icon: Presentation,  title: 'PPT to PDF',       desc: 'PowerPoint to PDF',      cat: 'Convert & Export', keywords: 'ppt pptx powerpoint' },
  
  // Security & Privacy
  { href: '/protect-pdf',  type: 'pdf',   icon: Lock,          title: 'Protect PDF',      desc: 'Encrypt with password',  cat: 'Security & Privacy', keywords: 'protect lock password encrypt' },
  { href: '/unlock-pdf',   type: 'pdf',   icon: Lock,          title: 'Unlock PDF',       desc: 'Remove passwords',       cat: 'Security & Privacy', keywords: 'unlock remove password decrypt' },
  { href: '/watermark-pdf', type: 'pdf',  icon: Droplets,      title: 'Watermark',        desc: 'Add stamp or text',      cat: 'Security & Privacy', keywords: 'watermark stamp overlay' },
  { href: '/privacy-clean', type: 'pdf',  icon: EyeOff,        title: 'Privacy Cleaner',  desc: 'Remove metadata',        cat: 'Security & Privacy', keywords: 'metadata hidden clean', badge: 'Privacy' },

  // Batch Tools & Others
  { href: '/compress-pdf', type: 'pdf',   icon: Minimize2,     title: 'Compress PDF',     desc: 'Reduce file size',       cat: 'Batch Tools', keywords: 'compress shrink optimize' },
  { href: '/batch-convert', type: 'pdf',  icon: FileStack,     title: 'Batch Convert',    desc: 'Process multiple files', cat: 'Batch Tools', keywords: 'batch bulk convert', badge: 'Pro' },
  { href: '/invert',       type: 'pdf',   icon: ArrowRightLeft, title: 'Invert Colors',   desc: 'Dark mode for PDFs',     cat: 'Batch Tools', keywords: 'invert dark mode color' },
  { href: '/md-to-pdf',    type: 'html',  icon: FileCode,      title: 'Markdown to PDF',  desc: 'Convert Code/MD',        cat: 'Batch Tools', keywords: 'markdown md code' },
];

const CATEGORIES = [
  'Edit & Annotate',
  'Organize & Manage',
  'Convert & Export',
  'Security & Privacy',
  'Batch Tools'
];

export default function HomePage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return ALL_TOOLS.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.keywords.includes(q)
    );
  }, [query]);

  // Grouped logic is now handled in FeatureGrid, but we might need it for filtered view if we want to show category
  // For now, filtered view is just a flat grid as per original design, which is fine.

  return (
    <div className="page-container">
      <section className={styles.hero}>
        
        {/* Logo */}
        <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Logo size={64} />
        </div>

        {/* Headline */}
        <h1 className={`${styles.heroTitle} animate-in animate-delay-1`}>
          Edit, Organize & Secure PDFs<br />
          <span className="gradient-text">100% In Your Browser.</span>
        </h1>

        <p className={`${styles.heroSubtitle} animate-in animate-delay-2`}>
          The privacy-first PDF tool. No uploads, no sign-ups, no watermarks.<br />
          Just powerful tools that run entirely on your device.
        </p>

        {/* Search */}
        <div className={`${styles.searchWrapper} animate-in animate-delay-3`}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="What do you want to do? e.g. merge, redact, convert..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.searchClear} onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Trust Bar */}
        <div className="animate-in animate-delay-3">
          <TrustBar />
        </div>

        {/* Visual Proof */}
        <div className="animate-in animate-delay-3" style={{ marginBottom: 40 }}>
           <VisualProof />
        </div>

        {/* Ad Banner Top */}
        <AdSlot slot="1234567890" format="horizontal" className={styles.adBanner} />

        {/* ── Content Area ── */}
        <div className="animate-in animate-delay-4">
          
          {filtered !== null ? (
            /* Search Results */
            <div className={styles.featureGridContainer}>
              <div className={styles.gridHeader} style={{ marginBottom: 32, textAlign: 'left' }}>
                 <h3 className={styles.sectionTitle} style={{ fontSize: '1.5rem' }}>
                   {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
                 </h3>
              </div>
              
              {filtered.length > 0 ? (
                <div className={styles.toolGrid}>
                  {filtered.map(t => <ToolCard key={t.href} tool={t} />)}
                </div>
              ) : (
                <div className={styles.emptySearch}>
                  No tools found. Try "merge", "compress", or "edit".
                </div>
              )}
            </div>
          ) : (
            /* Main Feature Grid */
            <>
                <FeatureGrid tools={ALL_TOOLS} categories={CATEGORIES} />
            </>
          )}

        </div>

        {/* Ad Banner Bottom */}
        <AdSlot slot="3456789012" format="horizontal" className={styles.adBanner} />

      </section>
    </div>
  );
}
