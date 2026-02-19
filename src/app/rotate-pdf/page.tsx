'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { useToast } from '../components/ui/Toast';
import { RotateCw, Upload, FileText, Download, Loader2, ListRestart } from 'lucide-react';

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotation, setRotation] = useState(90);
  const [applyTo, setApplyTo] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    try {
      const ab = await f.arrayBuffer();
      const pdf = await PDFDocument.load(ab, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
    } catch { setPageCount(0); }
  }, []);

  const rotatePdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const pdf = await PDFDocument.load(ab, { ignoreEncryption: true });
      const pages = pdf.getPages();

      if (applyTo === 'all') {
        pages.forEach(p => p.setRotation(degrees(p.getRotation().angle + rotation)));
      } else {
        const indices = parsePageRange(customPages, pages.length);
        indices.forEach(i => {
          if (pages[i]) pages[i].setRotation(degrees(pages[i].getRotation().angle + rotation));
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_rotated.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { 
      console.error(err); 
      addToast('Error rotating PDF', 'error'); 
    }
    finally { setIsProcessing(false); }
  };

  const parsePageRange = (input: string, max: number): number[] => {
    const indices = new Set<number>();
    input.split(',').map(s => s.trim()).forEach(r => {
      if (r.includes('-')) {
        const [a, b] = r.split('-').map(Number);
        if (a && b) for (let i = a; i <= Math.min(b, max); i++) indices.add(i - 1);
      } else {
        const n = Number(r);
        if (n >= 1 && n <= max) indices.add(n - 1);
      }
    });
    return Array.from(indices);
  };

  const reset = () => { setFile(null); setPageCount(0); setCustomPages(''); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div className="wrapper animate-in" style={{ paddingTop: 40 }}>
        <div className="section-header">
          <div className="section-badge"><RotateCw size={14} /> Rotate</div>
          <h1 className="section-title">Rotate <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">Rotate all or specific pages by 90°, 180°, or 270°.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to rotate</div>
            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="animate-in" style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ width: 44, height: 44, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={22} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{pageCount} pages</div>
                </div>
                <button className="btn btn-ghost" onClick={reset} style={{ padding: 8 }}><ListRestart size={18} /></button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Rotation</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[90, 180, 270].map(deg => (
                    <button key={deg} className={`btn ${rotation === deg ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setRotation(deg)} style={{ flex: 1, justifyContent: 'center' }}>
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Apply to</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button className={`btn ${applyTo === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setApplyTo('all')} style={{ flex: 1, justifyContent: 'center' }}>All Pages</button>
                  <button className={`btn ${applyTo === 'custom' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setApplyTo('custom')} style={{ flex: 1, justifyContent: 'center' }}>Custom</button>
                </div>
                {applyTo === 'custom' && (
                  <input type="text" placeholder="e.g. 1, 3-5, 8" value={customPages} onChange={e => setCustomPages(e.target.value)}
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem' }} />
                )}
              </div>

              <button className="btn btn-primary" onClick={rotatePdf} disabled={isProcessing}
                style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
                {isProcessing ? <><Loader2 className="spinner" /> Rotating...</> : <><RotateCw size={18} /> Rotate & Download</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
