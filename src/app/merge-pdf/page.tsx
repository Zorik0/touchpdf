'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import Script from 'next/script';
import { 
  Combine, 
  Upload, 
  FileText, 
  X, 
  Download, 
  Loader2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import styles from '../organize/Organize.module.css'; // Reuse existing styles

interface PdfFile {
  id: string;
  file: File;
  pageCount: number;
}

export default function MergePdfPage() {
  const [items, setItems] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const pdfjsLib = (window as any).pdfjsLib;
    
    const newItems: Promise<PdfFile>[] = Array.from(files)
      .filter(f => f.type === 'application/pdf')
      .map(async (file) => {
        let pageCount = 0;
        if (pdfjsLib) {
          try {
             const ab = await file.arrayBuffer();
             const pdf = await pdfjsLib.getDocument(ab).promise;
             pageCount = pdf.numPages;
          } catch (e) { console.error(e); }
        }
        return {
          id: Math.random().toString(36).substring(7),
          file,
          pageCount
        };
      });

    const resolved = await Promise.all(newItems);
    setItems(prev => [...prev, ...resolved]);
  }, []);

  const moveItem = (index: number, direction: -1 | 1) => {
    const newItems = [...items];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const mergePdfs = async () => {
    if (items.length < 2) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const item of items) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }
      
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged_document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Merge error:', err);
      alert('Failed to merge PDFs. Some files might be encrypted or corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="page-container">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        strategy="afterInteractive"
      />

      <div className={`wrapper animate-in`} style={{paddingTop: 40}}>
        <div className="section-header">
          <div className="section-badge">
            <Combine size={14} /> Merge Tool
          </div>
          <h1 className="section-title">
            Merge <span className="gradient-text">PDFs</span>
          </h1>
          <p className="section-subtitle">
            Combine multiple PDF files into one single document. Drag and drop to reorder.
          </p>
        </div>

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
            <strong>Drop PDFs here</strong> to merge
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {items.length > 0 && (
          <div className="animate-in animate-delay-1" style={{marginTop: 32}}>
             <div className="section-header" style={{marginBottom: 24, textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span className="status-pill info">{items.length} files selected</span>
                <button 
                  className="btn btn-primary" 
                  onClick={mergePdfs}
                  disabled={isProcessing || items.length < 2}
                >
                  {isProcessing ? <><Loader2 className="spinner" /> Merging...</> : <><Combine size={18} /> Merge PDFs</>}
                </button>
             </div>
             
             <div className={styles.grid}>
               {items.map((item, index) => (
                 <div key={item.id} className={styles.pageCard} style={{height: 'auto', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                     <div style={{width: 40, height: 40, background:'var(--bg-secondary)', borderRadius: 8, display:'flex', alignItems:'center', justifyContent:'center'}}>
                       <FileText size={20} />
                     </div>
                     <div>
                       <div style={{fontWeight: 600, fontSize: '0.9rem'}}>{item.file.name.slice(0, 30)}</div>
                       <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{item.pageCount > 0 ? `${item.pageCount} pages • ` : ''}{(item.file.size / 1024 / 1024).toFixed(2)} MB</div>
                     </div>
                   </div>
                   
                   <div style={{display:'flex', gap: 8}}>
                     <button className={styles.actionBtn} onClick={() => moveItem(index, -1)} disabled={index === 0}>
                       <ArrowUp size={16} />
                     </button>
                     <button className={styles.actionBtn} onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                       <ArrowDown size={16} />
                     </button>
                     <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => removeItem(item.id)}>
                       <X size={16} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
