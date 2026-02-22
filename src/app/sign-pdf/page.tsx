'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PenLine, Upload, Download, Loader2, X, Trash2, Type } from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';

type Mode = 'draw' | 'type';

export default function PdfSignPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('draw');
  const [typedSig, setTypedSig] = useState('');
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sigX, setSigX] = useState(50);
  const [sigY, setSigY] = useState(90);
  const [sigScale, setSigScale] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Signature pad drawing
  useEffect(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 400;
    canvas.height = 150;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 150);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDraw = (e: React.MouseEvent) => {
    isDrawingRef.current = true;
    const ctx = sigCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = sigCanvasRef.current!.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const ctx = sigCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = sigCanvasRef.current!.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawingRef.current = false;
    if (sigCanvasRef.current) {
      setSigDataUrl(sigCanvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSig = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSigDataUrl(null);
  };

  const generateTypedSig = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 100);
    ctx.font = 'italic 36px "Dancing Script", cursive, "Times New Roman", serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText(typedSig, 20, 60);
    setSigDataUrl(canvas.toDataURL('image/png'));
  };

  const loadPdf = async (f: File) => {
    setFile(f);
    try {
      const pdfjs = await initPdfWorker();
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await pdfjs.getDocument({ data }).promise;
      setTotalPages(doc.numPages);
    } catch { /* ignore */ }
  };

  const process = async () => {
    if (!file || !sigDataUrl) { addToast('Draw or type a signature first', 'error'); return; }
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const pdf = await PDFDocument.load(data);
      const sigBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer());
      const sigImg = await pdf.embedPng(new Uint8Array(sigBytes));
      const dims = sigImg.scale(sigScale / 100);
      const page = pdf.getPages()[Math.max(0, Math.min(pageNum - 1, pdf.getPageCount() - 1))];
      const { width, height } = page.getSize();

      page.drawImage(sigImg, {
        x: (sigX / 100) * width,
        y: height - (sigY / 100) * height - dims.height,
        width: dims.width,
        height: dims.height,
      });

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name.replace('.pdf', '-signed.pdf'); a.click();
      URL.revokeObjectURL(url);
      addToast('PDF signed successfully', 'success');
    } catch (e) { console.error(e); addToast('Error signing PDF', 'error'); }
    finally { setIsProcessing(false); }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) loadPdf(e.dataTransfer.files[0]); };

  const fieldStyle = { padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', width: '100%' } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><PenLine size={14} /> Sign PDF</div>
          <h1 className="section-title">Sign Your <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">Draw or type your signature, place it on any page, and download the signed PDF. 100% private.</p>
        </div>

        {/* Signature creation */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className={`btn ${mode === 'draw' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('draw')}><PenLine size={14} /> Draw</button>
            <button className={`btn ${mode === 'type' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('type')}><Type size={14} /> Type</button>
          </div>

          {mode === 'draw' ? (
            <>
              <canvas
                ref={sigCanvasRef}
                style={{ width: '100%', maxWidth: 400, height: 150, borderRadius: 8, border: '1px solid var(--glass-border)', cursor: 'crosshair', display: 'block', background: '#fff' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
              />
              <button className="btn btn-ghost" onClick={clearSig} style={{ marginTop: 8 }}><Trash2 size={14} /> Clear</button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={typedSig} onChange={e => setTypedSig(e.target.value)} placeholder="Your name" style={{ ...fieldStyle, flex: 1 }} />
              <button className="btn btn-primary" onClick={generateTypedSig} disabled={!typedSig}>Create</button>
            </div>
          )}

          {sigDataUrl && (
            <div style={{ marginTop: 12, padding: 8, background: '#fff', borderRadius: 8, display: 'inline-block' }}>
              <img src={sigDataUrl} alt="signature" style={{ maxWidth: 200, height: 'auto' }} />
            </div>
          )}
        </div>

        {/* PDF Upload */}
        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to sign</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Page</label><input type="number" value={pageNum} onChange={e => setPageNum(Number(e.target.value))} min={1} max={totalPages} style={fieldStyle} /></div>
              <div><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>X Position %</label><input type="number" value={sigX} onChange={e => setSigX(Number(e.target.value))} min={0} max={100} style={fieldStyle} /></div>
              <div><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Y Position %</label><input type="number" value={sigY} onChange={e => setSigY(Number(e.target.value))} min={0} max={100} style={fieldStyle} /></div>
              <div><label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Size %</label><input type="number" value={sigScale} onChange={e => setSigScale(Number(e.target.value))} min={5} max={200} style={fieldStyle} /></div>
            </div>

            <button className="btn btn-primary" onClick={process} disabled={isProcessing || !sigDataUrl} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Signing...</> : <><Download size={18} /> Sign & Download</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
