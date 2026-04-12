'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Palette, Upload, Download, Loader2, X } from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';

export default function GrayscalePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const process = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const pdfjs = await initPdfWorker();
      const data = new Uint8Array(await file.arrayBuffer());
      const srcDoc = await pdfjs.getDocument({ data }).promise;
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < srcDoc.numPages; i++) {
        setProgress(Math.round(((i + 1) / srcDoc.numPages) * 100));
        const page = await srcDoc.getPage(i + 1);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: vp } as any).promise;

        // Convert to grayscale
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let j = 0; j < d.length; j += 4) {
          const gray = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
          d[j] = d[j + 1] = d[j + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);

        const imgBytes = await fetch(canvas.toDataURL('image/jpeg', 0.92)).then(r => r.arrayBuffer());
        const img = await newPdf.embedJpg(new Uint8Array(imgBytes));
        const p = newPdf.addPage([vp.width / 2, vp.height / 2]);
        p.drawImage(img, { x: 0, y: 0, width: vp.width / 2, height: vp.height / 2 });
      }

      const out = await newPdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name.replace('.pdf', '-grayscale.pdf'); a.click();
      URL.revokeObjectURL(url);
      addToast(`Converted ${srcDoc.numPages} pages to grayscale`, 'success');
    } catch (e) { console.error(e); addToast('Error processing PDF', 'error'); }
    finally { setIsProcessing(false); }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Palette size={14} /> Grayscale</div>
          <h1 className="section-title">Convert to <span className="gradient-text">Grayscale</span></h1>
          <p className="section-subtitle">Convert a color PDF to black & white. Perfect for printing or reducing file size.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to convert to grayscale</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            {isProcessing && (
              <div className="progress-bar" style={{ marginBottom: 16 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            )}
            <button className="btn btn-primary" onClick={process} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Converting... {progress}%</> : <><Download size={18} /> Convert to Grayscale</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
