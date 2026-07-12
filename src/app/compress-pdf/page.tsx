'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '../components/ui/Toast';
import { serverCompress, isUnreachable } from '../lib/api';
import { Minimize2, Upload, FileText, Download, Loader2, ListRestart, Info } from 'lucide-react';

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [compressedUrl, setCompressedUrl] = useState('');
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke the compressed blob URL when the component unmounts to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
  }, [compressedUrl]);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setOriginalSize(f.size);
    setDone(false);
    setCompressedSize(0);
  }, []);

  const compressPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    // Real compression on our server (Ghostscript re-encodes images and
    // streams) — typically far smaller than the in-browser structural pass,
    // which remains as the offline fallback below.
    try {
      const blob = await serverCompress(file, 'ebook');
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
      setCompressedSize(blob.size);
      setDone(true);
      setIsProcessing(false);
      return;
    } catch (err) {
      if (!isUnreachable(err)) {
        addToast(err instanceof Error ? err.message : 'Failed to compress PDF.', 'error');
        setIsProcessing(false);
        return;
      }
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      // Strip metadata
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('TouchPDF');
      pdfDoc.setCreator('TouchPDF');

      // Save with object streams (smaller output)
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100,
      });

      const blob = new Blob([compressedBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
      setCompressedSize(compressedBytes.length);
      setDone(true);
    } catch (err) {
      console.error(err);
      addToast('Failed to compress PDF.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!compressedUrl) return;
    const a = document.createElement('a');
    a.href = compressedUrl;
    a.download = `${file?.name.replace('.pdf', '')}_compressed.pdf`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setDone(false);
    setCompressedSize(0);
    setOriginalSize(0);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setCompressedUrl('');
  };

  const savings = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="page-container">
      <div className="wrapper animate-in" style={{ paddingTop: 40 }}>
        <div className="section-header">
          <div className="section-badge"><Minimize2 size={14} /> Compress</div>
          <h1 className="section-title">Compress <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">Real compression — images and streams are re-encoded for much smaller files. Processed securely, never stored.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to compress</div>
            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="animate-in" style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ width: 44, height: 44, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{file.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{(originalSize / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button className="btn btn-ghost" onClick={reset} style={{ padding: '8px' }}><ListRestart size={18} /></button>
              </div>

              {done ? (
                <div className="animate-in" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: savings > 0 ? 'var(--success)' : 'var(--text-secondary)', marginBottom: 8 }}>
                    {savings > 0 ? `-${savings}%` : '0%'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                    {(originalSize / 1024 / 1024).toFixed(2)} MB → {(compressedSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button className="btn btn-primary" onClick={downloadResult} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
                    <Download size={18} /> Download Compressed PDF
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={compressPdf} disabled={isProcessing}
                  style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
                  {isProcessing ? <><Loader2 className="spinner" /> Compressing...</> : <><Minimize2 size={18} /> Compress PDF</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
