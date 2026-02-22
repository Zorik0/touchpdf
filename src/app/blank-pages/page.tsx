'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FilePlus2, Upload, Download, Loader2, X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function AddBlankPagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<'start' | 'end' | 'after-each' | 'at-index'>('end');
  const [pageIndex, setPageIndex] = useState(1);
  const [count, setCount] = useState(1);
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
      const firstPage = pdf.getPages()[0];
      const { width, height } = firstPage.getSize();

      if (position === 'start') {
        for (let i = 0; i < count; i++) pdf.insertPage(0, [width, height]);
      } else if (position === 'end') {
        for (let i = 0; i < count; i++) pdf.addPage([width, height]);
      } else if (position === 'after-each') {
        const total = pdf.getPageCount();
        for (let i = total - 1; i >= 0; i--) {
          for (let j = 0; j < count; j++) pdf.insertPage(i + 1, [width, height]);
        }
      } else if (position === 'at-index') {
        const idx = Math.max(0, Math.min(pageIndex, pdf.getPageCount()));
        for (let i = 0; i < count; i++) pdf.insertPage(idx, [width, height]);
      }

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name.replace('.pdf', '-blanks.pdf'); a.click();
      URL.revokeObjectURL(url);
      addToast(`Added blank pages — now ${pdf.getPageCount()} total`, 'success');
    } catch (e) { console.error(e); addToast('Error processing PDF', 'error'); }
    finally { setIsProcessing(false); }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><FilePlus2 size={14} /> Blank Pages</div>
          <h1 className="section-title">Add <span className="gradient-text">Blank Pages</span></h1>
          <p className="section-subtitle">Insert blank pages at the start, end, after each page, or at a specific position.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to add blank pages</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Position</label>
                <select value={position} onChange={e => setPosition(e.target.value as typeof position)} style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                  <option value="start">At Start</option>
                  <option value="end">At End</option>
                  <option value="after-each">After Each Page</option>
                  <option value="at-index">At Specific Page</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Number of Blanks</label>
                <input type="number" value={count} onChange={e => setCount(Math.max(1, Number(e.target.value)))} min={1} max={50} style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
              {position === 'at-index' && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>After Page #</label>
                  <input type="number" value={pageIndex} onChange={e => setPageIndex(Number(e.target.value))} min={0} style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }} />
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={process} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Processing...</> : <><Download size={18} /> Add Blanks & Download</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
