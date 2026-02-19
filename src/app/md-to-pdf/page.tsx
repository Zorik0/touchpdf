'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { marked } from 'marked';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FileText, 
  Settings, 
  Eye, 
  Download, 
  RefreshCw, 
  Type, 
  Code, 
  FileEdit,
  XCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import styles from './MdToPdf.module.css';
import { useToast } from '../components/ui/Toast';

const DEFAULT_CSS = `/* Custom PDF Styles */
body {
  font-family: 'Inter', sans-serif;
  color: #1a1a2e;
  line-height: 1.6;
}

h1 {
  color: #2d2d4e;
  border-bottom: 2px solid #eaeaea;
  padding-bottom: 10px;
}

code {
  background: #f4f4f5;
  color: #d63384;
  padding: 2px 4px;
  border-radius: 4px;
}

blockquote {
  border-left: 4px solid #7c5cfc;
  background: #f9f9ff;
  font-style: italic;
  padding: 10px;
}

img {
  max-width: 100%;
  border-radius: 8px;
}
`;

const TEMPLATES = {
  readme: `# My Project

## Overview
A brief description of what this project does.

## Installation
\`\`\`bash
npm install my-project
\`\`\`

## Features
- **Fast** — optimized for speed
- **Simple** — easy to use API

## License
MIT © 2026`,

  notes: `# Meeting Notes — Feb 19, 2026

## Agenda
1. Sprint review
2. Upcoming deadlines

## Key Points
- Feature X is **on track**
- Bug #42 needs investigation

> **Action Item:** Finalize docs by Friday.`,

  blog: `# The Future of Tools

*Published on Feb 19, 2026*

---

In a world of cloud-based apps, there's something refreshing about tools that work **entirely in your browser**.

## Why Client-Side Matters
1. **Privacy** — files never leave your device
2. **Speed** — no upload wait times

---
*Share your thoughts below.*`,
};

export default function MdToPdfPage() {
  const [markdown, setMarkdown] = useState('');
  const [customCss, setCustomCss] = useState(DEFAULT_CSS);
  const [showCss, setShowCss] = useState(false);
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const htmlContent = useMemo(() => {
    if (!markdown.trim()) return '';
    return marked.parse(markdown, { async: false }) as string;
  }, [markdown]);

  const generatePdf = useCallback(async () => {
    if (!previewRef.current || !markdown.trim()) return;
    setGenerating(true);

    try {
      // Create a temporary element for rendering to PDF
      const tempDiv = document.createElement('div');
      tempDiv.id = 'pdf-render-root';
      tempDiv.innerHTML = htmlContent;
      
      // Base styles necessary for good PDF rendering
      const baseStyles = `
        #pdf-render-root {
          position: fixed;
          left: -9999px;
          top: 0;
          width: 800px;
          padding: 48px;
          background: white;
          font-size: 14px;
        }
      `;
      // Append base styles + user custom CSS
      const styleTag = document.createElement('style');
      styleTag.textContent = baseStyles + '\n' + customCss.replace(/body/g, '#pdf-render-root'); 
      // Note: simplistic scoping replacement for body, but real CSS parsing is complex. 
      // Users should use selectors that match the content.
      
      tempDiv.appendChild(styleTag);
      document.body.appendChild(tempDiv);

      // Render to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(tempDiv);

      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('markdown-document.pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
      addToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  }, [htmlContent, markdown, customCss]);

  return (
    <div className="page-container">
      <div className={`${styles.wrapper} animate-in`}>
        <div className="section-header">
          <div className="section-badge">
            <FileText size={14} /> Markdown Converter
          </div>
          <h1 className="section-title">
            Markdown to <span className="gradient-text">PDF</span>
          </h1>
          <p className="section-subtitle">
            Paste your Markdown, style it with custom CSS, preview live, and export to PDF.
          </p>
        </div>

        {/* Template chips */}
        <div className={`${styles.templates} animate-in animate-delay-1`} style={{ justifyContent: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginRight: 4 }}>Templates:</span>
          {Object.entries(TEMPLATES).map(([key, val]) => (
             <button key={key} className={styles.templateBtn} onClick={() => setMarkdown(val)}>
               {key === 'readme' ? '📦 README' : key === 'notes' ? '📋 Notes' : '✍️ Blog'}
             </button>
          ))}
          <div className={styles.divider} />
          <button 
             className={`${styles.toggleBtn} ${showCss ? styles.active : ''}`}
             onClick={() => setShowCss(!showCss)}
          >
             {showCss ? <><XCircle size={14} /> Hide CSS</> : <><Settings size={14} /> Edit CSS</>}
          </button>
        </div>

        <div className={`${styles.editorGrid} animate-in animate-delay-2 ${showCss ? styles.withCss : ''}`}>
          {/* Editor Panel */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>
                <FileEdit size={14} /> Markdown
                <span className={styles.charCount}>{markdown.length} chars</span>
              </span>
              {markdown && (
                <button className={styles.templateBtn} onClick={() => setMarkdown('')} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>
            <textarea
              className="md-textarea"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="# Paste your Markdown here..."
              spellCheck={false}
            />
          </div>

          {/* CSS Panel (Conditional) */}
          {showCss && (
            <div className={`${styles.panel} animate-in`}>
              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>
                  <Code size={14} /> Custom CSS
                </span>
                <button className={styles.templateBtn} onClick={() => setCustomCss(DEFAULT_CSS)} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={12} /> Reset
                </button>
              </div>
              <textarea
                className="md-textarea"
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder="/* Add your custom CSS here */"
                spellCheck={false}
                style={{ fontFamily: 'monospace', color: 'var(--accent-3)' }}
              />
            </div>
          )}

          {/* Preview Panel */}
          <div className={`${styles.panel} ${styles.previewPanelWrapper}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>
                <Eye size={14} /> Preview
              </span>
            </div>
            {htmlContent ? (
              <div className={styles.previewContainer}>
                 {/* Live preview style injection */}
                 <style dangerouslySetInnerHTML={{ __html: customCss }} />
                 <div
                   ref={previewRef}
                   className="md-preview"
                   dangerouslySetInnerHTML={{ __html: htmlContent }}
                 />
              </div>
            ) : (
              <div className={`md-preview ${styles.emptyPreview}`}>
                <div className={styles.emptyIcon}>
                  <Type size={40} strokeWidth={1} />
                </div>
                <div className={styles.emptyText}>Preview will appear here…</div>
              </div>
            )}
          </div>
        </div>

        {/* Download bar */}
        <div className={`${styles.downloadBar} animate-in animate-delay-3`}>
          <span className={styles.downloadHint}>
            {markdown.trim() ? <><CheckCircle2 size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:4}} /> Ready to export</> : 'Type or paste Markdown to get started'}
          </span>
          <button
            className="btn btn-primary"
            onClick={generatePdf}
            disabled={!markdown.trim() || generating}
          >
            {generating ? (
              <>
                <span className="spinner" /> Generating…
              </>
            ) : (
              <>
                <Download size={18} /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
