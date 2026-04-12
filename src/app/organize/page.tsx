'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  Layers, 
  Upload, 
  Save, 
  Trash2, 
  RotateCcw, 
  Loader2, 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  X
} from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';
import styles from './Organize.module.css';

interface PageItem {
  id: string; // Unique ID for key
  originalIndex: number; // 0-based index in original PDF
  thumbnailUrl: string;
}

export default function OrganizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPdfBytes, setOriginalPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { addToast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track all created blob URLs so we can revoke them precisely.
  // Using a ref (not state) avoids re-render loops.
  const blobUrlsRef = useRef<string[]>([]);

  // Revoke all tracked URLs only when the component unmounts.
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setPages([]);

    // Auto-start processing
    setTimeout(() => loadPdf(f), 100);
  }, []);

  const loadPdf = async (f: File) => {
    setProcessing(true);
    try {
      const arrayBuffer = await f.arrayBuffer();
      setOriginalPdfBytes(arrayBuffer); // Store for later saving

      const pdfjs = await initPdfWorker();
      const loadingTask = pdfjs.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      const newPages: PageItem[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 0.5; // Single-pixel thumbnail is enough
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
           await page.render({ canvasContext: ctx, viewport } as any).promise;
           const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.8));
           if (blob) {
             const thumbnailUrl = URL.createObjectURL(blob);
             blobUrlsRef.current.push(thumbnailUrl);
             newPages.push({
               id: Math.random().toString(36).substring(7),
               originalIndex: i - 1,
               thumbnailUrl,
             });
           }
        }
        // Update incrementally
        if (i % 5 === 0) setPages([...newPages]);
      }
      setPages([...newPages]);

    } catch (err) {
      console.error('Error loading PDF:', err);
      addToast('Failed to load PDF.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const newPages = [...pages];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newPages.length) return;
    
    // Swap
    [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];
    setPages(newPages);
  };

  const deletePage = (id: string) => {
    const page = pages.find(p => p.id === id);
    if (page) {
      URL.revokeObjectURL(page.thumbnailUrl);
      blobUrlsRef.current = blobUrlsRef.current.filter(u => u !== page.thumbnailUrl);
    }
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const savePdf = async () => {
    if (!originalPdfBytes || pages.length === 0) return;
    setProcessing(true);

    try {
      // Load original
      const srcDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
      
      // Create new
      const newDoc = await PDFDocument.create();
      
      // Get indices in current order
      const indices = pages.map(p => p.originalIndex);
      
      // Copy pages
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      
      // Add each copied page
      copiedPages.forEach(page => newDoc.addPage(page));
      
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `organized_${file?.name || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error saving PDF:', err);
      addToast('Failed to save organized PDF.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
    setFile(null);
    setPages([]);
    setOriginalPdfBytes(null);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="page-container">

      <div className={`${styles.wrapper} animate-in`}>
        <div className="section-header">
          <div className="section-badge">
            <Layers size={14} /> Organize Pages
          </div>
          <h1 className="section-title">
            PDF <span className="gradient-text">Organizer</span>
          </h1>
          <p className="section-subtitle">
            Reorder, delete, and reorganize pages in your PDF document.
          </p>
        </div>

        {!file ? (
          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="drop-zone-icon">
              <Upload size={48} strokeWidth={1} />
            </div>
            <div className="drop-zone-text">
              <strong>Drop your PDF here</strong> to start organizing
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <>
            <div className={`${styles.toolbar} animate-in`}>
              <div className={styles.fileInfo}>
                <span className="status-pill info">
                  <FileText size={14} /> {file.name}
                </span>
                <span className="status-pill">{pages.length} pages</span>
              </div>
              <div style={{display:'flex', gap:10}}>
                <button 
                  className="btn btn-primary" 
                  onClick={savePdf} 
                  disabled={processing || pages.length === 0}
                >
                  {processing ? <><Loader2 className="spinner" /> Saving...</> : <><Save size={18} /> Save PDF</>}
                </button>
                <button className="btn btn-ghost" onClick={reset}>
                  <X size={16} /> Close
                </button>
              </div>
            </div>

            {processing && pages.length === 0 && (
               <div style={{textAlign:'center', padding:40}}>
                 <Loader2 className="spinner" style={{width: 24, height: 24, margin: '0 auto 10px'}} /> Load pages...
               </div>
            )}

            <div className={`${styles.grid} animate-in`}>
              {pages.map((page, index) => (
                <div key={page.id} className={styles.pageCard}>
                  <div className={styles.pageThumb}>
                    <img src={page.thumbnailUrl} alt={`Page ${page.originalIndex + 1}`} />
                    <span className={styles.pageNumber}>{index + 1}</span>
                  </div>
                  <div className={styles.cardFooter}>
                    <button 
                      className={styles.actionBtn} 
                      onClick={() => movePage(index, -1)} 
                      disabled={index === 0}
                      title="Move Left"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button 
                       className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                       onClick={() => deletePage(page.id)}
                       title="Delete Page"
                    >
                       <Trash2 size={16} />
                    </button>
                    <button 
                       className={styles.actionBtn} 
                       onClick={() => movePage(index, 1)} 
                       disabled={index === pages.length - 1}
                       title="Move Right"
                    >
                       <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
