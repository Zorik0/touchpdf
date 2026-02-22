'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ArrowDownUp, Upload, Download, Loader2, X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function ReversePages() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const process = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const src = await PDFDocument.load(data);
      const newPdf = await PDFDocument.create();
      const indices = Array.from({ length: src.getPageCount() }, (_, i) => i).reverse();
      const pages = await newPdf.copyPages(src, indices);
      pages.forEach(p => newPdf.addPage(p));

      const out = await newPdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name.replace('.pdf', '-reversed.pdf'); a.click();
      URL.revokeObjectURL(url);
      addToast(`Reversed ${src.getPageCount()} pages`, 'success');
    } catch (e) { console.error(e); addToast('Error processing PDF', 'error'); }
    finally { setIsProcessing(false); }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><ArrowDownUp size={14} /> Reverse Pages</div>
          <h1 className="section-title">Reverse <span className="gradient-text">Page Order</span></h1>
          <p className="section-subtitle">Reverse the order of all pages in your PDF. Useful for duplex printing or flipping presentations.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to reverse page order</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <button className="btn btn-primary" onClick={process} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Processing...</> : <><Download size={18} /> Reverse & Download</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
