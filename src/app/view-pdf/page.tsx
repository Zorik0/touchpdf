'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { initPdfWorker } from '../lib/pdf-worker';
import styles from './PDFViewer.module.css';
import { BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Upload } from 'lucide-react';

function getCacheKey(file: File) {
  return `pdf-viewer-page:${file.name}:${file.size}`;
}

export default function ViewPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // State (not a ref) so the render effect re-runs when the document loads.
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load PDF when file changes
  useEffect(() => {
    if (!file) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const pdfjs = await initPdfWorker();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);

        // Restore last page
        const saved = localStorage.getItem(getCacheKey(file));
        const startPage = saved ? Math.min(parseInt(saved, 10), pdf.numPages) : 1;
        setCurrentPage(startPage);
      } catch {
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [file]);

  // Render page
  useEffect(() => {
    const pdf = pdfDoc;
    if (!pdf || !canvasRef.current) return;
    let cancelled = false;

    const render = async () => {
      // Cancel any in-progress render
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
        renderTaskRef.current = null;
      }

      setLoading(true);
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
        if (!cancelled) setLoading(false);
      } catch (e) {
        if ((e as Error)?.name !== 'RenderingCancelledException') {
          setLoading(false);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, scale]);

  // Persist page to localStorage
  useEffect(() => {
    if (file && numPages > 0) {
      localStorage.setItem(getCacheKey(file), String(currentPage));
    }
  }, [file, currentPage, numPages]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        setCurrentPage(p => Math.min(p + 1, numPages));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        setCurrentPage(p => Math.max(p - 1, 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [numPages]);

  const handleFile = useCallback((f: File) => {
    if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);
      setFile(f);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const goTo = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, numPages)));
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <BookOpen size={20} />
        <span>PDF Viewer</span>
      </div>

      {!file ? (
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={40} />
          <p>Drop a PDF here or click to open</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={onFileInput}
            hidden
          />
        </div>
      ) : (
        <div className={styles.viewer}>
          <div className={styles.toolbar}>
            <button
              className={styles.btn}
              onClick={() => { setPdfDoc(null); setFile(null); setNumPages(0); }}
              title="Open another file"
            >
              <Upload size={16} />
            </button>

            <div className={styles.nav}>
              <button className={styles.btn} onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1}>
                <ChevronLeft size={16} />
              </button>
              <span className={styles.pageInfo}>
                <input
                  type="number"
                  className={styles.pageInput}
                  value={currentPage}
                  min={1}
                  max={numPages}
                  onChange={e => goTo(parseInt(e.target.value, 10) || 1)}
                />
                <span>/ {numPages}</span>
              </span>
              <button className={styles.btn} onClick={() => goTo(currentPage + 1)} disabled={currentPage >= numPages}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className={styles.zoom}>
              <button className={styles.btn} onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))} title="Zoom out">
                <ZoomOut size={16} />
              </button>
              <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
              <button className={styles.btn} onClick={() => setScale(s => Math.min(4, +(s + 0.25).toFixed(2)))} title="Zoom in">
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          <div className={styles.canvasWrap}>
            {loading && <div className={styles.loadingOverlay}><div className={styles.spinner} /></div>}
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>
        </div>
      )}
    </main>
  );
}
