'use client';

import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import { Presentation, Upload, Download, Loader2, X, Info } from 'lucide-react';
import { parsePptx, SlideData } from '../lib/ooxml';
import { useToast } from '../components/ui/Toast';

export default function PptToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadFile = async (f: File) => {
    if (!f.name.match(/\.pptx$/i)) {
      addToast('Please upload a .pptx file', 'error');
      return;
    }
    setFile(f);
    setSlides([]);
    setIsProcessing(true);
    try {
      const parsed = await parsePptx(await f.arrayBuffer());
      setSlides(parsed);
    } catch (e) {
      console.error(e);
      addToast('Could not read this file — is it a valid .pptx?', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePdf = () => {
    if (!file || slides.length === 0) return;
    setIsProcessing(true);
    try {
      // 16:9 slide-shaped pages
      const pageW = 254, pageH = 142.9, margin = 16;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pageW, pageH] });

      slides.forEach((slide, si) => {
        if (si > 0) pdf.addPage([pageW, pageH], 'landscape');

        // background + accent bar
        pdf.setFillColor(250, 250, 252);
        pdf.rect(0, 0, pageW, pageH, 'F');
        pdf.setFillColor(124, 92, 252);
        pdf.rect(0, 0, pageW, 2.5, 'F');

        let y = margin + 6;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(26, 26, 46);
        const title = slide.title || `Slide ${si + 1}`;
        const titleLines = pdf.splitTextToSize(title, pageW - margin * 2);
        pdf.text(titleLines, margin, y);
        y += titleLines.length * 9 + 4;

        pdf.setDrawColor(124, 92, 252);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y - 2, margin + 40, y - 2);
        y += 4;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 70);
        for (const para of slide.paragraphs) {
          const lines = pdf.splitTextToSize(para, pageW - margin * 2 - 6);
          if (y + lines.length * 6 > pageH - margin) break; // keep one page per slide
          pdf.circle(margin + 1.2, y - 1.4, 0.8, 'F');
          pdf.text(lines, margin + 5, y);
          y += lines.length * 6 + 2.5;
        }

        // slide number
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`${si + 1} / ${slides.length}`, pageW - margin, pageH - 6, { align: 'right' });
      });

      pdf.save(file.name.replace(/\.pptx$/i, '') + '.pdf');
      addToast(`Converted ${slides.length} slides`, 'success');
    } catch (e) {
      console.error(e);
      addToast('Error generating PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => { setFile(null); setSlides([]); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Presentation size={14} /> PPT to PDF</div>
          <h1 className="section-title">PowerPoint to <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">Convert .pptx slides into a clean PDF handout — titles and bullet text, one page per slide, all in your browser.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop .pptx here</strong> to convert to PDF</div>
            <input ref={inputRef} type="file" accept=".pptx" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ maxWidth: 680, margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            {isProcessing && slides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                <Loader2 className="spinner" style={{ width: 28, height: 28, marginBottom: 10 }} />
                <div>Reading slides…</div>
              </div>
            ) : slides.length > 0 ? (
              <>
                <div style={{ maxHeight: 300, overflow: 'auto', marginBottom: 16 }}>
                  {slides.map((s, i) => (
                    <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: 'rgba(0,0,0,0.25)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                        {i + 1}. {s.title || 'Untitled slide'}
                      </div>
                      {s.paragraphs.slice(0, 3).map((p, j) => (
                        <div key={j} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: 12 }}>• {p.slice(0, 90)}{p.length > 90 ? '…' : ''}</div>
                      ))}
                      {s.paragraphs.length > 3 && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: 12 }}>… {s.paragraphs.length - 3} more</div>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Text-based conversion: slide titles and bullet text are kept; images, themes, and animations are not.</span>
                </div>

                <button className="btn btn-primary" onClick={generatePdf} disabled={isProcessing} style={{ width: '100%' }}>
                  {isProcessing ? <><Loader2 className="spinner" /> Working...</> : <><Download size={18} /> Convert {slides.length} Slides to PDF</>}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No slides found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
