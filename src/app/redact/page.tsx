'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PDFDocument, rgb } from 'pdf-lib';
import { Upload, Download, Eraser, Trash2, ShieldAlert } from 'lucide-react';
import styles from './Redact.module.css';
import { useToast } from '../components/ui/Toast';

// Dynamic import with SSR disabled to avoid 'DOMMatrix is not defined' error
const PDFViewer = dynamic(() => import('./PDFViewer'), { ssr: false });

interface RedactionRect {
    id: string;
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

export default function RedactPage() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rects, setRects] = useState<RedactionRect[]>([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const { addToast } = useToast();

  // Handle File Upload
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setRects([]); // Reset redactions
      setPageNumber(1);
      setNumPages(0);
    }
  };

  const onPageLoadSuccess = (page: { width: number; height: number }) => {
      setPageWidth(page.width);
      setPageHeight(page.height);
  };

  const handleRectsChange = (newPageRects: Omit<RedactionRect, 'page'>[]) => {
      // Filter out rects for current page and add new ones
      const otherRects = rects.filter(r => r.page !== pageNumber);
      const currentRects = newPageRects.map(r => ({ ...r, page: pageNumber }));
      setRects([...otherRects, ...currentRects]);
  };

  const handleRedactAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
        const fileBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);

        // Process each page that has redactions
        const pages = pdfDoc.getPages();
        const pagesToRedact = new Set(rects.map(r => r.page));

        for (const pIndex of pagesToRedact) {
            // pIndex is 1-based from UI, so subtract 1
            const page = pages[pIndex - 1];
            const { width, height } = page.getSize();
            
            // Get redactions for this page
            const pageRects = rects.filter(r => r.page === pIndex);

            // Draw black rectangles
            for (const r of pageRects) {
                const scaledX = r.x;
                const scaledY = r.y;
                const scaledW = r.w;
                const scaledH = r.h;

                const pdfY = height - scaledY - scaledH; // Flip Y

                page.drawRectangle({
                    x: scaledX,
                    y: pdfY,
                    width: scaledW,
                    height: scaledH,
                    color: rgb(0, 0, 0),
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        
        // Download
        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `redacted-${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

    } catch (err) {
        console.error("Redaction failed", err);
        addToast("Failed to redact PDF", 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Redact PDF</h1>
        <p className={styles.subtitle}>Permanently remove sensitive information. Files are processed entirely on your device.</p>
      </div>

      {/* Main Workspace */}
      <div className={styles.workspace}>
        
        {!file ? (
            <div className={styles.uploadZone}>
                <input type="file" onChange={onFileChange} accept=".pdf" id="pdf-upload" hidden />
                <label htmlFor="pdf-upload" className={styles.uploadLabel}>
                    <Upload size={48} className={styles.uploadIcon} />
                    <span className={styles.uploadText}>Click to upload or drag and drop PDF</span>
                    <span className={styles.uploadSubtext}>Maximum file size: 50MB</span>
                </label>
            </div>
        ) : (
            <div className={styles.editorContainer}>
                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <div className={styles.toolGroup}>
                        <button className={`${styles.toolBtn} ${styles.active}`}>
                            <Eraser size={18} />
                            <span>Redact</span>
                        </button>
                    </div>
                    
                    <div className={styles.pagination}>
                        <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>Prev</button>
                        <span>{pageNumber} / {numPages || '--'}</span>
                        <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>Next</button>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => setFile(null)} title="Remove file">
                            <Trash2 size={18} />
                        </button>
                        <button className={styles.downloadBtn} onClick={handleRedactAndDownload} disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : 'Redact & Download'}
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className={styles.documentWrapper}>
                    <PDFViewer
                        file={file}
                        rects={rects}
                        pageNumber={pageNumber}
                        scale={scale}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        onPageLoadSuccess={onPageLoadSuccess}
                        onRectsChange={handleRectsChange}
                    />
                </div>
            </div>
        )}
      </div>

      {/* Info Section */}
      <div className={styles.infoSection}>
        <div className={styles.infoItem}>
            <ShieldAlert size={20} className={styles.infoIcon} />
            <div>
                <h3>True Redaction</h3>
                <p>We draw opaque blocks over your content. For maximum security, we recommend checking the &ldquo;Flatten&rdquo; option (coming soon) to rasterize pages.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
