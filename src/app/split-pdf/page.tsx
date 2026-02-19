'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';
import { 
  Scissors, 
  Upload, 
  FileText, 
  Download, 
  Loader2,
  CheckCircle2,
  ListRestart
} from 'lucide-react';
import styles from '../organize/Organize.module.css';

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitRange, setSplitRange] = useState('');
  const [splitMode, setSplitMode] = useState<'all' | 'range'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    
    try {
      const ab = await f.arrayBuffer();
      const pdfjs = await initPdfWorker();
      const pdf = await pdfjs.getDocument(ab).promise;
      setPageCount(pdf.numPages);
    } catch (err) {
      console.error(err);
      addToast('Error reading PDF', 'error');
    }
  }, []);

  const splitPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const zip = new JSZip();
      
      if (splitMode === 'all') {
        const pageIndices = pdf.getPageIndices();
        for (let i = 0; i < pageIndices.length; i++) {
          const newDoc = await PDFDocument.create();
          const [copiedPage] = await newDoc.copyPages(pdf, [i]);
          newDoc.addPage(copiedPage);
          const bytes = await newDoc.save();
          zip.file(`page-${i + 1}.pdf`, bytes);
        }
      } else {
        // Parse range (e.g., "1-3, 5, 7-9")
        const ranges = splitRange.split(',').map(s => s.trim());
        const selectedIndices = new Set<number>();
        
        ranges.forEach(r => {
          if (r.includes('-')) {
            const [start, end] = r.split('-').map(Number);
            if (start && end) {
              for (let i = start; i <= end; i++) selectedIndices.add(i - 1);
            }
          } else {
            const page = Number(r);
            if (page) selectedIndices.add(page - 1);
          }
        });

        // Loop through unique sorted indices
        const indices = Array.from(selectedIndices).sort((a, b) => a - b);
        for (const i of indices) {
           if (i >= 0 && i < pdf.getPageCount()) {
              const newDoc = await PDFDocument.create();
              const [copiedPage] = await newDoc.copyPages(pdf, [i]);
              newDoc.addPage(copiedPage);
              const bytes = await newDoc.save();
              zip.file(`page-${i + 1}.pdf`, bytes);
           }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_split.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      addToast('Error splitting PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const reset = () => {
      setFile(null);
      setPageCount(0);
      setSplitRange('');
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
      <div className={`wrapper animate-in`} style={{paddingTop: 40}}>
        <div className="section-header">
           <div className="section-badge"><Scissors size={14} /> Split Tool</div>
           <h1 className="section-title">Split <span className="gradient-text">PDF</span></h1>
           <p className="section-subtitle">Extract single pages or ranges from your PDF document.</p>
        </div>

        {!file ? (
          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
             <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
             <div className="drop-zone-text"><strong>Drop PDF here</strong> to split</div>
             <input ref={fileInputRef} type="file" accept=".pdf" style={{display:'none'}} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="animate-in animate-delay-1" style={{maxWidth: 600, margin: '0 auto'}}>
             
             <div className="glass-card" style={{padding: 24, borderRadius: 16}}>
                <div style={{display:'flex', alignItems:'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)'}}>
                   <div style={{width: 48, height: 48, background: 'var(--bg-secondary)', borderRadius: 12, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <FileText size={24} />
                   </div>
                   <div style={{flex: 1}}>
                      <h3 style={{fontSize: '1.1rem', fontWeight: 600, margin: 0}}>{file.name}</h3>
                      <p style={{margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem'}}>{pageCount} pages detected</p>
                   </div>
                   <button className="btn btn-ghost" onClick={reset}><ListRestart size={18} /></button>
                </div>

                <div style={{marginBottom: 24}}>
                   <label style={{display:'block', marginBottom: 12, fontWeight: 600}}>Split Mode</label>
                   <div style={{display:'flex', gap: 12, marginBottom: 16}}>
                      <button 
                         className={`btn ${splitMode === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                         onClick={() => setSplitMode('all')}
                         style={{flex: 1, justifyContent:'center'}}
                      >
                         Extract All Pages
                      </button>
                      <button 
                         className={`btn ${splitMode === 'range' ? 'btn-primary' : 'btn-ghost'}`}
                         onClick={() => setSplitMode('range')}
                         style={{flex: 1, justifyContent:'center'}}
                      >
                         Select Range
                      </button>
                   </div>

                   {splitMode === 'range' && (
                      <div className="animate-in">
                         <label style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 8, display:'block'}}>
                            Enter page numbers (e.g. 1, 3-5, 10)
                         </label>
                         <input 
                            type="text" 
                            className="input-field" 
                            placeholder="e.g. 1-5, 8, 11-13" 
                            value={splitRange} 
                            onChange={e => setSplitRange(e.target.value)}
                            style={{
                               width: '100%', 
                               padding: '12px', 
                               borderRadius: 8, 
                               border: '1px solid var(--glass-border)', 
                               background: 'rgba(0,0,0,0.2)',
                               color: 'white',
                               fontSize: '1rem'
                            }}
                         />
                      </div>
                   )}
                </div>

                <button 
                   className="btn btn-primary" 
                   onClick={splitPdf} 
                   disabled={isProcessing || (splitMode === 'range' && !splitRange)}
                   style={{width: '100%', justifyContent: 'center', padding: 14}}
                >
                   {isProcessing ? <><Loader2 className="spinner" /> Processing...</> : <><Download size={18} /> Split and Download ZIP</>}
                </button>
             </div>

          </div>
        )}
      </div>
    </div>
  );
}
