'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Image as ImageIcon, 
  Upload, 
  Download, 
  RotateCcw, 
  FileText, 
  Layers, 
  Package,
  Loader2
} from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';
import styles from './PdfToPng.module.css';

interface PageImage {
  pageNum: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

export default function PdfToPngPage() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<PageImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const { addToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track all created blob URLs to revoke them precisely.
  const blobUrlsRef = useRef<string[]>([]);

  // Revoke all tracked URLs only on unmount.
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setImages([]);

    // Auto-start processing
    setTimeout(() => processPdf(f), 100);
  }, []);

  const processPdf = async (f: File) => {
    setProcessing(true);
    setProgress(0);
    setImages([]);

    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdfjs = await initPdfWorker();
      const loadingTask = pdfjs.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      const newImages: PageImage[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2.0; // High resolution
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
           await page.render({ canvasContext: ctx, viewport } as any).promise;

           // Convert to blob
           const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
           if (blob) {
             const dataUrl = URL.createObjectURL(blob);
             blobUrlsRef.current.push(dataUrl);
             newImages.push({
               pageNum: i,
               dataUrl,
               blob,
               width: viewport.width,
               height: viewport.height
             });
           }
        }
        
        setProgress(Math.round((i / totalPages) * 100));
        // Update images incrementally to show progress
        setImages([...newImages]);
      }
    } catch (err) {
      console.error('Error converting PDF:', err);
      addToast('Failed to convert PDF. It might be corrupted or password protected.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const downloadSingle = (img: PageImage) => {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = `${file?.name.replace('.pdf', '')}_page-${img.pageNum}.png`;
    a.click();
  };

  const downloadAllZip = async () => {
    if (images.length === 0) return;
    const zip = new JSZip();
    const folder = zip.folder('images');
    
    if (folder) {
      images.forEach(img => {
        folder.file(`page-${img.pageNum}.png`, img.blob);
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file?.name.replace('.pdf', '')}_images.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const reset = () => {
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
    setFile(null);
    setImages([]);
    setProgress(0);
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
            <ImageIcon size={14} /> Convert to Image
          </div>
          <h1 className="section-title">
            PDF to <span className="gradient-text">PNG</span>
          </h1>
          <p className="section-subtitle">
            Convert entire PDFs into high-quality PNG images instantly.
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
              <strong>Drop your PDF here</strong> or click to browse
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
                {images.length > 0 && (
                  <span className={styles.fileSize}>
                    <Layers size={14} style={{display:'inline', marginRight:4}} /> 
                    {images.length} pages
                  </span>
                )}
              </div>
              <div className={styles.actions}>
                <button 
                  className="btn btn-primary" 
                  onClick={downloadAllZip} 
                  disabled={processing || images.length === 0}
                >
                  <Package size={18} /> Download All (ZIP)
                </button>
                <button className="btn btn-ghost" onClick={reset}>
                  <RotateCcw size={16} /> Start Over
                </button>
              </div>
            </div>

            {processing && (
              <div className="progress-bar">
                 <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            <div className={styles.grid}>
              {images.map((img) => (
                <div key={img.pageNum} className={`${styles.card} animate-in`}>
                  <div className={styles.cardPreview}>
                     <img src={img.dataUrl} alt={`Page ${img.pageNum}`} />
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.pageLabel}>Page {img.pageNum}</span>
                    <button 
                      className={styles.downloadBtn}
                      onClick={() => downloadSingle(img)}
                      title="Download PNG"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {processing && images.length === 0 && (
               <div style={{textAlign:'center', padding: 40, color:'var(--text-muted)'}}>
                  <Loader2 className="spinner" style={{marginBottom:10, width: 24, height: 24, border: 'none'}} />
                  <div>Initializing PDF Engine...</div>
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
