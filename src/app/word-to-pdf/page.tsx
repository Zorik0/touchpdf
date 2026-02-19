'use client';

import { useState, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import { FileText, Upload, Download, Loader2, ListRestart } from 'lucide-react';

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.match(/\.(docx)$/i)) {
      alert('Please upload a .docx file');
      return;
    }
    setFile(f);
    setIsProcessing(true);

    try {
      const arrayBuffer = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(result.value);
    } catch (err) {
      console.error(err);
      alert('Failed to parse Word document.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const convertToPdf = async () => {
    if (!htmlContent) return;
    setIsConverting(true);

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const container = document.getElementById('word-preview');
      if (!container) return;

      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${file?.name.replace(/\.docx$/i, '')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF.');
    } finally {
      setIsConverting(false);
    }
  };

  const reset = () => { setFile(null); setHtmlContent(''); };

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
          <div className="section-badge"><FileText size={14} /> Word Converter</div>
          <h1 className="section-title">Word to <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">Convert .docx files to PDF. Preview before downloading. 100% client-side.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop .docx here</strong> to convert</div>
            <input ref={fileInputRef} type="file" accept=".docx" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} />
                <span style={{ fontWeight: 600 }}>{file.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={reset}><ListRestart size={16} /></button>
                <button className="btn btn-primary" onClick={convertToPdf} disabled={isConverting || !htmlContent}>
                  {isConverting ? <><Loader2 className="spinner" /> Converting...</> : <><Download size={16} /> Download PDF</>}
                </button>
              </div>
            </div>

            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <Loader2 className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
                <div>Parsing document…</div>
              </div>
            ) : (
              <div id="word-preview"
                style={{
                  background: 'white', color: '#1a1a1a', padding: '40px 48px', borderRadius: 12,
                  fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.8,
                  maxHeight: 600, overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
