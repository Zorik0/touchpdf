'use client';

import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Hash, Upload, Download, Loader2, X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

type Position = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';

export default function PageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [startNum, setStartNum] = useState(1);
  const [fontSize, setFontSize] = useState(10);
  const [prefix, setPrefix] = useState('');
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
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = `${prefix}${startNum + i}`;
        const tw = font.widthOfTextAtSize(text, fontSize);
        let x = 0, y = 0;
        const margin = 30;

        switch (position) {
          case 'bottom-center': x = (width - tw) / 2; y = margin; break;
          case 'bottom-left': x = margin; y = margin; break;
          case 'bottom-right': x = width - tw - margin; y = margin; break;
          case 'top-center': x = (width - tw) / 2; y = height - margin; break;
          case 'top-left': x = margin; y = height - margin; break;
          case 'top-right': x = width - tw - margin; y = height - margin; break;
        }

        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
      });

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name.replace('.pdf', '-numbered.pdf'); a.click();
      URL.revokeObjectURL(url);
      addToast(`Added page numbers to ${pages.length} pages`, 'success');
    } catch (e) { console.error(e); addToast('Error processing PDF', 'error'); }
    finally { setIsProcessing(false); }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Hash size={14} /> Page Numbers</div>
          <h1 className="section-title">Add <span className="gradient-text">Page Numbers</span></h1>
          <p className="section-subtitle">Add sequential page numbers to every page of your PDF. Choose position, font size, and starting number.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> or click to browse</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Position</label>
                <select value={position} onChange={e => setPosition(e.target.value as Position)} style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Start Number</label>
                <input type="number" value={startNum} onChange={e => setStartNum(Number(e.target.value))} min={1} style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Font Size</label>
                <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} min={6} max={24} style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prefix (optional)</label>
                <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="e.g. Page " style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={process} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Processing...</> : <><Download size={18} /> Add Page Numbers & Download</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
