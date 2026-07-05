'use client';

import { useState, useRef, useCallback } from 'react';
import { Diff, Upload, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';

interface PdfFile { file: File; pages: string[]; totalPages: number; }

export default function ComparePdfPage() {
  const [pdfA, setPdfA] = useState<PdfFile | null>(null);
  const [pdfB, setPdfB] = useState<PdfFile | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputA = useRef<HTMLInputElement>(null);
  const inputB = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadPdf = useCallback(async (file: File, side: 'A' | 'B') => {
    setIsLoading(true);
    try {
      const pdfjs = await initPdfWorker();
      const data = new Uint8Array(await file.arrayBuffer());
      const doc = await pdfjs.getDocument({ data }).promise;
      const pages: string[] = [];

      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const vp = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
        pages.push(canvas.toDataURL('image/jpeg', 0.8));
      }

      const pdfFile = { file, pages, totalPages: doc.numPages };
      if (side === 'A') setPdfA(pdfFile);
      else setPdfB(pdfFile);
      setPageIdx(0);
    } catch (e) { console.error(e); addToast('Error loading PDF', 'error'); }
    finally { setIsLoading(false); }
  }, [addToast]);

  const maxPages = Math.max(pdfA?.totalPages || 0, pdfB?.totalPages || 0);

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Diff size={14} /> Compare PDFs</div>
          <h1 className="section-title">Compare <span className="gradient-text">Two PDFs</span></h1>
          <p className="section-subtitle">View two PDFs side by side to visually compare differences page by page.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* PDF A */}
          <div>
            {!pdfA ? (
              <div className="drop-zone" style={{ minHeight: 120 }} onClick={() => inputA.current?.click()}>
                <div className="drop-zone-text"><strong>Upload PDF A</strong></div>
                <input ref={inputA} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0], 'A')} />
              </div>
            ) : (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{pdfA.file.name}</span>
                  <button onClick={() => setPdfA(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                </div>
                {pdfA.pages[pageIdx] && <img src={pdfA.pages[pageIdx]} alt={`A page ${pageIdx + 1}`} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--glass-border)' }} />}
              </div>
            )}
          </div>

          {/* PDF B */}
          <div>
            {!pdfB ? (
              <div className="drop-zone" style={{ minHeight: 120 }} onClick={() => inputB.current?.click()}>
                <div className="drop-zone-text"><strong>Upload PDF B</strong></div>
                <input ref={inputB} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0], 'B')} />
              </div>
            ) : (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{pdfB.file.name}</span>
                  <button onClick={() => setPdfB(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                </div>
                {pdfB.pages[pageIdx] && <img src={pdfB.pages[pageIdx]} alt={`B page ${pageIdx + 1}`} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--glass-border)' }} />}
              </div>
            )}
          </div>
        </div>

        {/* Page navigation */}
        {maxPages > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <button className="btn btn-ghost" disabled={pageIdx <= 0} onClick={() => setPageIdx(p => p - 1)}><ChevronLeft size={18} /></button>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>Page {pageIdx + 1} of {maxPages}</span>
            <button className="btn btn-ghost" disabled={pageIdx >= maxPages - 1} onClick={() => setPageIdx(p => p + 1)}><ChevronRight size={18} /></button>
          </div>
        )}

        {isLoading && <div style={{ textAlign: 'center', marginTop: 24 }}><Loader2 className="spinner" size={32} /></div>}
      </div>
    </div>
  );
}
