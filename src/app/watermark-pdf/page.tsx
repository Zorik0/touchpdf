'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { useToast } from '../components/ui/Toast';
import { Droplets, Upload, FileText, Download, Loader2, ListRestart, X, Plus } from 'lucide-react';

export default function WatermarkPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.15);
  const [fontSize, setFontSize] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fl: FileList | null) => {
    if (!fl) return;
    const pdfs = Array.from(fl).filter(f => f.type === 'application/pdf');
    setFiles(prev => [...prev, ...pdfs]);
  }, []);

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const addWatermark = async () => {
    if (files.length === 0 || !watermarkText.trim()) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      for (let fi = 0; fi < files.length; fi++) {
        setProgress(Math.round(((fi + 1) / files.length) * 100));
        const file = files[fi];
        const ab = await file.arrayBuffer();
        const pdf = await PDFDocument.load(ab, { ignoreEncryption: true });
        const font = await pdf.embedFont(StandardFonts.HelveticaBold);
        const pages = pdf.getPages();

        for (const page of pages) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

          page.drawText(watermarkText, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: fontSize,
            font,
            color: rgb(0.5, 0.5, 0.5),
            opacity: opacity,
            rotate: degrees(-45),
          });
        }

        const bytes = await pdf.save();
        const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace('.pdf', '')}_watermarked.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      addToast(`Watermarked ${files.length} file(s)`, 'success');
    } catch (err) { 
      console.error(err); 
      addToast('Error adding watermark', 'error'); 
    }
    finally { setIsProcessing(false); }
  };

  const reset = () => { setFiles([]); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); };

  return (
    <div className="page-container">
      <div className="wrapper animate-in" style={{ paddingTop: 40 }}>
        <div className="section-header">
          <div className="section-badge"><Droplets size={14} /> Watermark</div>
          <h1 className="section-title">Add <span className="gradient-text">Watermark</span></h1>
          <p className="section-subtitle">Stamp text watermarks on every page. Supports batch processing — watermark multiple PDFs at once.</p>
        </div>

        {files.length === 0 ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDFs here</strong> to watermark (supports multiple)</div>
            <input ref={fileInputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }}
              onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
        ) : (
          <div className="animate-in" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
              {/* File list */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{files.length} PDF(s)</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => fileInputRef.current?.click()}><Plus size={12} /> Add More</button>
                    <button className="btn btn-ghost" onClick={reset} style={{ padding: '4px 10px', fontSize: '0.75rem' }}><ListRestart size={12} /> Clear</button>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }}
                    onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                </div>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '0.82rem' }}>
                    <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
                  </div>
                ))}
              </div>

              {/* Settings */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Watermark Text</label>
                <input type="text" value={watermarkText} onChange={e => setWatermarkText(e.target.value)}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem' }} />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.85rem' }}>Font Size: {fontSize}px</label>
                  <input type="range" min="20" max="120" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.85rem' }}>Opacity: {Math.round(opacity * 100)}%</label>
                  <input type="range" min="5" max="80" value={opacity * 100} onChange={e => setOpacity(Number(e.target.value) / 100)} style={{ width: '100%' }} />
                </div>
              </div>

              {isProcessing && (
                <div className="progress-bar" style={{ marginBottom: 12 }}>
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              )}

              <button className="btn btn-primary" onClick={addWatermark} disabled={isProcessing || !watermarkText.trim()}
                style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
                {isProcessing ? <><Loader2 className="spinner" /> Processing {progress}%...</> : <><Download size={18} /> Watermark {files.length > 1 ? `All ${files.length} PDFs` : '& Download'}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
