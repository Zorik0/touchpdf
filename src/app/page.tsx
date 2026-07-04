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
  { href: '/view-pdf',     type: 'pdf',   icon: BookOpen,      title: 'PDF Viewer',       desc: 'Read PDFs, resume where left off', cat: 'Edit & Annotate', keywords: 'view read open pdf viewer reader' },
  { href: '/extract-text', type: 'pdf',   icon: Type,          title: 'Extract Text',     desc: 'Copy text from any PDF', cat: 'Edit & Annotate', keywords: 'extract copy text content' },
  { href: '/annotate',     type: 'pdf',   icon: Highlighter,   title: 'Annotate PDF',     desc: 'Draw, highlight, sign',  cat: 'Edit & Annotate', keywords: 'annotate draw highlight sign', badge: 'Soon' },
  { href: '/redact',       type: 'pdf',   icon: Eraser,        title: 'Redact PDF',       desc: 'Permanently hide info',  cat: 'Edit & Annotate', keywords: 'redact hide remove text', badge: 'Privacy' },
  
  // Organize & Manage
  { href: '/merge-pdf',    type: 'pdf',   icon: Combine,       title: 'Merge PDF',        desc: 'Combine multiple files', cat: 'Organize & Manage', keywords: 'merge combine join append' },
  { href: '/split-pdf',    type: 'pdf',   icon: Scissors,      title: 'Split PDF',        desc: 'Extract or split pages', cat: 'Organize & Manage', keywords: 'split separate extract' },
  { href: '/organize',     type: 'pdf',   icon: ArrowUpFromLine, title: 'Organize Pages', desc: 'Reorder, delete, rotate', cat: 'Organize & Manage', keywords: 'organize sort reorder delete' },
  { href: '/rotate-pdf',   type: 'pdf',   icon: RotateCw,      title: 'Rotate PDF',       desc: 'Fix page orientation',   cat: 'Organize & Manage', keywords: 'rotate turn flip' },

  // Convert & Export
  { href: '/pdf-to-word',  type: 'word',  icon: FileText,      title: 'PDF to Word',      desc: 'Convert to Docx',        cat: 'Convert & Export', keywords: 'word docx convert', badge: 'Soon' },
  { href: '/pdf-to-excel', type: 'excel', icon: Table,         title: 'PDF to Excel',     desc: 'Extract tables to XLSX', cat: 'Convert & Export', keywords: 'excel xlsx table spreadsheet', badge: 'Soon' },
  { href: '/pdf-to-png',   type: 'image', icon: ImageIcon,     title: 'PDF to JPG/PNG',   desc: 'Save pages as images',   cat: 'Convert & Export', keywords: 'jpg png image photo' },
  { href: '/png-to-pdf',   type: 'image', icon: ImageIcon,     title: 'JPG to PDF',       desc: 'Convert images to PDF',  cat: 'Convert & Export', keywords: 'jpg png image photo' },
  { href: '/print-assistor', type: 'image', icon: Printer,    title: 'Print Assistor',   desc: 'Passport & ID photo prep', cat: 'Convert & Export', keywords: 'print passport visa photo size id card wallet', badge: 'New' },
  { href: '/word-to-pdf',  type: 'word',  icon: FileText,      title: 'Word to PDF',      desc: 'Docx to PDF',            cat: 'Convert & Export', keywords: 'word docx' },
  { href: '/ppt-to-pdf',   type: 'ppt',   icon: Presentation,  title: 'PPT to PDF',       desc: 'PowerPoint to PDF',      cat: 'Convert & Export', keywords: 'ppt pptx powerpoint', badge: 'Soon' },
  
  // Security & Privacy
  { href: '/protect-pdf',  type: 'pdf',   icon: Lock,          title: 'Protect PDF',      desc: 'Add a password hint',    cat: 'Security & Privacy', keywords: 'protect lock password encrypt hint' },
  { href: '/unlock-pdf',   type: 'pdf',   icon: Lock,          title: 'Unlock PDF',       desc: 'Remove passwords',       cat: 'Security & Privacy', keywords: 'unlock remove password decrypt' },
  { href: '/watermark-pdf', type: 'pdf',  icon: Droplets,      title: 'Watermark',        desc: 'Add stamp or text',      cat: 'Security & Privacy', keywords: 'watermark stamp overlay' },
  { href: '/privacy-clean', type: 'pdf',  icon: EyeOff,        title: 'Privacy Cleaner',  desc: 'Remove metadata',        cat: 'Security & Privacy', keywords: 'metadata hidden clean', badge: 'Privacy' },

  // Batch Tools & Others
  { href: '/compress-pdf', type: 'pdf',   icon: Minimize2,     title: 'Compress PDF',     desc: 'Reduce file size',       cat: 'Batch Tools', keywords: 'compress shrink optimize' },
  { href: '/batch-convert', type: 'pdf',  icon: FileStack,     title: 'Batch Convert',    desc: 'Process multiple files', cat: 'Batch Tools', keywords: 'batch bulk convert', badge: 'Soon' },
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
];

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

        {/* Feature Badges */}
        <div className={`${styles.featureBadges} animate-in animate-delay-3`}>
          {ALL_TOOLS.map(t => (
            <Link key={t.href} href={t.href} className={styles.featureBadge}>
              <t.icon size={12} />
              {t.title}
            </Link>
          ))}
        </div>

        {/* Trust Bar */}
        <div className="animate-in animate-delay-3">
          <TrustBar />
        </div>

        {/* Visual Proof — hidden on mobile */}
        <div className={`${styles.visualProofWrap} animate-in animate-delay-3`}>
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
