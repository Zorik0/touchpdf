'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { Highlighter, PenLine, Upload, Download, Loader2, Undo2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';

type Tool = 'pen' | 'highlighter';

// Stroke points are stored in PDF points (canvas coords ÷ render scale),
// so they stay valid regardless of how the page is displayed or exported.
interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

const COLORS = ['#ffd400', '#ef4444', '#3b82f6', '#22c55e', '#1a1a2e'];
const RENDER_SCALE = 1.5;

export default function AnnotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [penWidth, setPenWidth] = useState(3);
  const [strokes, setStrokes] = useState<Record<number, Stroke[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const drawingRef = useRef<{ points: { x: number; y: number }[] } | null>(null);
  const { addToast } = useToast();

  const pageStrokes = strokes[pageNum] || [];

  // Load document
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await initPdfWorker();
        const data = new Uint8Array(await file.arrayBuffer());
        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (e) {
        console.error(e);
        addToast('Error loading PDF', 'error');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !pageCanvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        renderTaskRef.current?.cancel();
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = pageCanvasRef.current;
        const overlay = overlayRef.current;
        if (!canvas || !overlay || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        overlay.width = viewport.width;
        overlay.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
      } catch (e) {
        if ((e as Error)?.name !== 'RenderingCancelledException') console.error(e);
      }
      if (!cancelled) redrawOverlay();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, pageNum]);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, s: Stroke, scale: number) => {
    if (s.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * scale * (s.tool === 'highlighter' ? 4 : 1);
    ctx.globalAlpha = s.tool === 'highlighter' ? 0.35 : 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(s.points[0].x * scale, s.points[0].y * scale);
    for (const p of s.points.slice(1)) ctx.lineTo(p.x * scale, p.y * scale);
    ctx.stroke();
    ctx.restore();
  }, []);

  const redrawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    for (const s of strokes[pageNum] || []) drawStroke(ctx, s, RENDER_SCALE);
  }, [strokes, pageNum, drawStroke]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  // Pointer coords → PDF points (accounts for CSS scaling of the canvas)
  const getPos = (e: React.PointerEvent) => {
    const overlay = overlayRef.current!;
    const rect = overlay.getBoundingClientRect();
    const scaleX = rect.width > 0 ? overlay.width / rect.width : 1;
    const scaleY = rect.height > 0 ? overlay.height / rect.height : 1;
    return {
      x: ((e.clientX - rect.left) * scaleX) / RENDER_SCALE,
      y: ((e.clientY - rect.top) * scaleY) / RENDER_SCALE,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawingRef.current = { points: [getPos(e)] };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current.points.push(getPos(e));
    // live preview: redraw committed strokes + the in-progress one
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    for (const s of strokes[pageNum] || []) drawStroke(ctx, s, RENDER_SCALE);
    drawStroke(ctx, { tool, color, width: penWidth, points: drawingRef.current.points }, RENDER_SCALE);
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    const points = drawingRef.current.points;
    drawingRef.current = null;
    if (points.length < 2) return;
    setStrokes(prev => ({
      ...prev,
      [pageNum]: [...(prev[pageNum] || []), { tool, color, width: penWidth, points }],
    }));
  };

  const undo = () => {
    setStrokes(prev => {
      const cur = prev[pageNum] || [];
      if (cur.length === 0) return prev;
      return { ...prev, [pageNum]: cur.slice(0, -1) };
    });
  };

  const clearPage = () => setStrokes(prev => ({ ...prev, [pageNum]: [] }));

  const totalStrokes = Object.values(strokes).reduce((s, arr) => s + arr.length, 0);

  const exportPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pages = pdf.getPages();
      const exportScale = 2;

      for (const [pageStr, list] of Object.entries(strokes)) {
        if (list.length === 0) continue;
        const pageIdx = parseInt(pageStr, 10) - 1;
        const page = pages[pageIdx];
        if (!page) continue;
        const { width, height } = page.getSize();

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * exportScale);
        canvas.height = Math.round(height * exportScale);
        const ctx = canvas.getContext('2d')!;
        for (const s of list) drawStroke(ctx, s, exportScale);

        const pngBytes = await fetch(canvas.toDataURL('image/png')).then(r => r.arrayBuffer());
        const png = await pdf.embedPng(new Uint8Array(pngBytes));
        page.drawImage(png, { x: 0, y: 0, width, height });
      }

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, '') + '-annotated.pdf';
      a.click();
      URL.revokeObjectURL(url);
      addToast('Annotated PDF downloaded', 'success');
    } catch (e) {
      console.error(e);
      addToast('Error saving annotations', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => { setFile(null); setPdfDoc(null); setNumPages(0); setPageNum(1); setStrokes({}); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Highlighter size={14} /> Annotate</div>
          <h1 className="section-title">Annotate <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">Draw and highlight directly on your PDF, then download it with the annotations baked in. 100% on your device.</p>
        </div>

        {!file ? (
          <div className="drop-zone" onClick={() => document.getElementById('annotate-upload')?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]?.type === 'application/pdf') setFile(e.dataTransfer.files[0]); }}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to annotate</div>
            <input id="annotate-upload" type="file" accept=".pdf" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
        ) : (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
              <button className={`btn ${tool === 'pen' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 12px' }} onClick={() => setTool('pen')}><PenLine size={14} /> Pen</button>
              <button className={`btn ${tool === 'highlighter' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 12px' }} onClick={() => setTool('highlighter')}><Highlighter size={14} /> Highlight</button>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} aria-label={`color ${c}`}
                    style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid white' : '2px solid transparent' }} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Size</span>
                <input type="range" min={1} max={10} value={penWidth} onChange={e => setPenWidth(Number(e.target.value))} style={{ width: 70, accentColor: 'var(--accent-1)' }} />
              </div>

              <div style={{ flex: 1 }} />

              <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={undo} disabled={pageStrokes.length === 0} title="Undo"><Undo2 size={15} /></button>
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={clearPage} disabled={pageStrokes.length === 0} title="Clear page"><Trash2 size={15} /></button>
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={reset} title="Close file"><X size={15} /></button>
              <button className="btn btn-primary" onClick={exportPdf} disabled={isProcessing || totalStrokes === 0}>
                {isProcessing ? <><Loader2 className="spinner" /> Saving...</> : <><Download size={16} /> Download</>}
              </button>
            </div>

            {/* Pagination */}
            {numPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <button className="btn btn-ghost" style={{ padding: '4px 10px' }} disabled={pageNum <= 1} onClick={() => setPageNum(p => p - 1)}><ChevronLeft size={16} /></button>
                <span style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>{pageNum} / {numPages}</span>
                <button className="btn btn-ghost" style={{ padding: '4px 10px' }} disabled={pageNum >= numPages} onClick={() => setPageNum(p => p + 1)}><ChevronRight size={16} /></button>
              </div>
            )}

            {/* Canvas stack */}
            <div style={{ textAlign: 'center', overflow: 'auto' }}>
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                <canvas ref={pageCanvasRef} style={{ display: 'block', maxWidth: '100%', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }} />
                <canvas
                  ref={overlayRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
