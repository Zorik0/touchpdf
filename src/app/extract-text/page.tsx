'use client';

import { useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import { 
  FileText, 
  Upload, 
  Copy, 
  Check, 
  RotateCcw, 
  Type, 
  Loader2 
} from 'lucide-react';
import styles from './ExtractText.module.css';

export default function ExtractTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setText('');
    
    // Auto-start processing
    setTimeout(() => extractText(f), 100);
  }, []);

  const extractText = async (f: File) => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      alert('PDF Engine loading... please try again.');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await f.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      
      let fullText = '';

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `--- Page ${i} ---\n\n${pageText}\n\n`;
        
        setProgress(Math.round((i / totalPages) * 100));
      }
      
      setText(fullText);
    } catch (err) {
      console.error('Error extracting text:', err);
      alert('Failed to extract text. The PDF might be scanned or protected.');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setText('');
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
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        onLoad={() => {
          if ((window as any).pdfjsLib) {
             (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
        }}
        strategy="afterInteractive"
      />

      <div className={`${styles.wrapper} animate-in`}>
        <div className="section-header">
          <div className="section-badge">
            <Type size={14} /> Text Extraction
          </div>
          <h1 className="section-title">
            Extract <span className="gradient-text">PDF Text</span>
          </h1>
          <p className="section-subtitle">
            Pull raw text content from any PDF document for easy copying and editing.
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
              <strong>Drop your PDF here</strong> to extract text
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
          <div className="animate-in animate-delay-1">
             <div className="section-header" style={{ marginBottom: 10, marginTop: 20, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                   <span className="status-pill info"><FileText size={14} /> {file.name}</span>
                   {processing && <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{progress}% processed</span>}
                </div>
                <button className="btn btn-ghost" onClick={reset} style={{padding: '8px 16px', fontSize: '0.85rem'}}>
                  <RotateCcw size={14} /> New File
                </button>
             </div>

             <div className={styles.textContainer}>
                {text ? (
                   <>
                     <div className={styles.toolbar}>
                       <div className={styles.stats}>
                          <span className={styles.statItem}>
                             <Type size={14} /> {text.length} chars
                          </span>
                       </div>
                       <button 
                         className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                         onClick={copyToClipboard}
                       >
                         {copied ? <Check size={14} /> : <Copy size={14} />}
                         {copied ? 'Copied!' : 'Copy Text'}
                       </button>
                     </div>
                     <textarea 
                       className={styles.textArea} 
                       value={text} 
                       readOnly 
                     />
                   </>
                ) : (
                   <div style={{
                       height: '100%', 
                       display: 'flex', 
                       flexDirection: 'column', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       color: 'var(--text-muted)'
                   }}>
                      <Loader2 className="spinner" style={{width: 32, height: 32, marginBottom: 16}} />
                      <p>Extracting text from document...</p>
                   </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
