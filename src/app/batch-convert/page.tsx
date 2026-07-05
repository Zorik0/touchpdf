'use client';

import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { FileStack, Upload, Download, Loader2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';

type Mode = 'img2pdf' | 'pdf2png';

export default function BatchConvertPage() {
  const [mode, setMode] = useState<Mode>('img2pdf');
  const [files, setFiles] = useState<File[]>([]);
  const [mergeIntoOne, setMergeIntoOne] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const accept = mode === 'img2pdf' ? 'image/*' : '.pdf';

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const wanted = Array.from(fl).filter(f =>
      mode === 'img2pdf' ? f.type.startsWith('image/') : f.type === 'application/pdf'
    );
    if (wanted.length === 0) {
      addToast(mode === 'img2pdf' ? 'Please add image files' : 'Please add PDF files', 'error');
      return;
    }
    setFiles(prev => [...prev, ...wanted]);
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const loadImage = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load ' + file.name)); };
      img.src = url;
    });

  const imageToPdf = async (imgs: { img: HTMLImageElement; name: string }[]): Promise<Blob> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210, pageH = 297, margin = 10;
    imgs.forEach(({ img }, i) => {
      if (i > 0) pdf.addPage();
      const scale = Math.min((pageW - margin * 2) / img.width, (pageH - margin * 2) / img.height, 1);
      const w = img.width * scale, h = img.height * scale;
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pageW - w) / 2, (pageH - h) / 2, w, h);
    });
    return pdf.output('blob');
  };

  const process = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const zip = new JSZip();
      // Same-named uploads must not overwrite each other inside the ZIP
      const used = new Map<string, number>();
      const uniqueName = (base: string) => {
        const n = (used.get(base) || 0) + 1;
        used.set(base, n);
        return n === 1 ? base : `${base}-${n}`;
      };

      if (mode === 'img2pdf') {
        if (mergeIntoOne) {
          const imgs = [];
          for (let i = 0; i < files.length; i++) {
            imgs.push({ img: await loadImage(files[i]), name: files[i].name });
            setProgress(Math.round(((i + 1) / files.length) * 90));
          }
          const blob = await imageToPdf(imgs);
          triggerDownload(blob, 'images-combined.pdf');
          addToast(`Merged ${files.length} images into one PDF`, 'success');
          return;
        }
        for (let i = 0; i < files.length; i++) {
          const img = await loadImage(files[i]);
          const blob = await imageToPdf([{ img, name: files[i].name }]);
          zip.file(uniqueName(files[i].name.replace(/\.\w+$/, '')) + '.pdf', blob);
          setProgress(Math.round(((i + 1) / files.length) * 90));
        }
        const content = await zip.generateAsync({ type: 'blob' });
        triggerDownload(content, 'converted-pdfs.zip');
        addToast(`Converted ${files.length} images to PDFs`, 'success');
      } else {
        const pdfjs = await initPdfWorker();
        for (let i = 0; i < files.length; i++) {
          const data = new Uint8Array(await files[i].arrayBuffer());
          const doc = await pdfjs.getDocument({ data }).promise;
          const folder = zip.folder(uniqueName(files[i].name.replace(/\.pdf$/i, '')))!;
          for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const vp = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
            const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
            if (blob) folder.file(`page-${p}.png`, blob);
          }
          setProgress(Math.round(((i + 1) / files.length) * 90));
        }
        const content = await zip.generateAsync({ type: 'blob' });
        triggerDownload(content, 'converted-images.zip');
        addToast(`Converted ${files.length} PDFs to images`, 'success');
      }
    } catch (e) {
      console.error(e);
      addToast('Error during batch conversion', 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const switchMode = (m: Mode) => { setMode(m); setFiles([]); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><FileStack size={14} /> Batch Convert</div>
          <h1 className="section-title">Batch <span className="gradient-text">Convert</span></h1>
          <p className="section-subtitle">Convert many files at once — images to PDFs, or PDFs to images — and download everything as a ZIP.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
          <button className={`btn ${mode === 'img2pdf' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => switchMode('img2pdf')}>
            <ImageIcon size={14} /> Images → PDF
          </button>
          <button className={`btn ${mode === 'pdf2png' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => switchMode('pdf2png')}>
            <FileText size={14} /> PDFs → PNG
          </button>
        </div>

        {files.length === 0 ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop multiple {mode === 'img2pdf' ? 'images' : 'PDFs'} here</strong> to batch convert</div>
            <input ref={inputRef} type="file" accept={accept} multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
        ) : (
          <div style={{ maxWidth: 620, margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong>{files.length} file(s)</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => inputRef.current?.click()}>+ Add More</button>
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setFiles([])}>Clear</button>
              </div>
              <input ref={inputRef} type="file" accept={accept} multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>

            <div style={{ maxHeight: 220, overflow: 'auto', marginBottom: 16 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '0.82rem' }}>
                  {mode === 'img2pdf' ? <ImageIcon size={14} style={{ color: 'var(--text-muted)' }} /> : <FileText size={14} style={{ color: 'var(--text-muted)' }} />}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{(f.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
                </div>
              ))}
            </div>

            {mode === 'img2pdf' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', marginBottom: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={mergeIntoOne} onChange={e => setMergeIntoOne(e.target.checked)} style={{ accentColor: 'var(--accent-1)' }} />
                Merge all images into a single PDF
              </label>
            )}

            {isProcessing && (
              <div className="progress-bar" style={{ marginBottom: 12 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            <button className="btn btn-primary" onClick={process} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Converting... {progress}%</> : <><Download size={18} /> Convert {files.length} File{files.length > 1 ? 's' : ''}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
