'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Crop, Upload, Download, Loader2, X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function CropPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const process = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const pdf = await PDFDocument.load(data);
      const pages = pdf.getPages();

      pages.forEach(page => {
        const { width, height } = page.getSize();
        // CropBox defines visible area
        page.setCropBox(
          left,           // x
          bottom,         // y
          width - left - right,   // width
          height - top - bottom   // height
        );
      });

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name.replace('.pdf', '-cropped.pdf'); a.click();
      URL.revokeObjectURL(url);
      addToast(`Cropped ${pages.length} pages`, 'success');
    } catch (e) { console.error(e); addToast('Error processing PDF', 'error'); }
    finally { setIsProcessing(false); }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };

  const fieldStyle = { width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Crop size={14} /> Crop PDF</div>
          <h1 className="section-title">Crop <span className="gradient-text">PDF Pages</span></h1>
          <p className="section-subtitle">Trim margins from all pages. Set the amount to crop from each side in points (1 inch = 72 points).</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to crop margins</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Top (pt)</label><input type="number" value={top} onChange={e => setTop(Math.max(0, Number(e.target.value)))} min={0} style={fieldStyle} /></div>
              <div><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Bottom (pt)</label><input type="number" value={bottom} onChange={e => setBottom(Math.max(0, Number(e.target.value)))} min={0} style={fieldStyle} /></div>
              <div><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Left (pt)</label><input type="number" value={left} onChange={e => setLeft(Math.max(0, Number(e.target.value)))} min={0} style={fieldStyle} /></div>
              <div><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Right (pt)</label><input type="number" value={right} onChange={e => setRight(Math.max(0, Number(e.target.value)))} min={0} style={fieldStyle} /></div>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16, fontStyle: 'italic' }}>Tip: 72 pt = 1 inch, 28.35 pt = 1 cm</p>

            <button className="btn btn-primary" onClick={process} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Processing...</> : <><Download size={18} /> Crop & Download</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
