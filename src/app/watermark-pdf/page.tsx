'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Droplets, Upload, FileText, Download, Loader2, ListRestart } from 'lucide-react';

export default function WatermarkPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.15);
  const [fontSize, setFontSize] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
  }, []);

  const addWatermark = async () => {
    if (!file || !watermarkText.trim()) return;
    setIsProcessing(true);

    try {
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
          rotate: { type: 0 as any, angle: -45 },
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
    } catch (err) { console.error(err); alert('Error adding watermark'); }
    finally { setIsProcessing(false); }
  };

  const reset = () => { setFile(null); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div className="wrapper animate-in" style={{ paddingTop: 40 }}>
        <div className="section-header">
          <div className="section-badge"><Droplets size={14} /> Watermark</div>
          <h1 className="section-title">Add <span className="gradient-text">Watermark</span></h1>
          <p className="section-subtitle">Stamp text watermarks on every page of your PDF. Customizable text, size, and opacity.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to watermark</div>
            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="animate-in" style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ width: 44, height: 44, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={22} /></div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{file.name}</div></div>
                <button className="btn btn-ghost" onClick={reset} style={{ padding: 8 }}><ListRestart size={18} /></button>
              </div>

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

              <button className="btn btn-primary" onClick={addWatermark} disabled={isProcessing || !watermarkText.trim()}
                style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
                {isProcessing ? <><Loader2 className="spinner" /> Processing...</> : <><Download size={18} /> Add Watermark & Download</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
