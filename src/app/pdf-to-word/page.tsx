'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, Download, Loader2, X, Info } from 'lucide-react';
import { extractPageLines, lineToText } from '../lib/pdf-text';
import { buildDocx, DocxParagraph } from '../lib/ooxml';
import { useToast } from '../components/ui/Toast';
import { serverConvert, downloadBlob, isUnreachable } from '../lib/api';

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [paragraphs, setParagraphs] = useState<DocxParagraph[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadPdf = async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setParagraphs([]);
    setIsProcessing(true);
    setProgress(0);
    try {
      const pages = await extractPageLines(await f.arrayBuffer(), setProgress);
      const paras: DocxParagraph[] = [];
      pages.forEach((lines, pi) => {
        if (pi > 0) paras.push({ text: '' }); // blank line between pages
        for (const line of lines) {
          const text = lineToText(line);
          if (!text) continue;
          // Treat noticeably larger text as a heading
          const avgH = line.fragments.reduce((s, fr) => s + fr.height, 0) / line.fragments.length;
          paras.push({ text, heading: avgH >= 16 });
        }
      });
      setParagraphs(paras);
      if (paras.length === 0) addToast('No selectable text found — this PDF may be scanned images', 'info');
    } catch (e) {
      console.error(e);
      addToast('Error reading PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadDocx = async () => {
    if (!file) return;
    setIsProcessing(true);

    // High-fidelity conversion on our server (LibreOffice) — keeps layout and
    // images, not just text. Falls back to in-browser text extraction if the
    // server can't be reached.
    try {
      const blob = await serverConvert(file, 'docx');
      downloadBlob(blob, file.name.replace(/\.pdf$/i, '') + '.docx');
      addToast('Word document downloaded', 'success');
      setIsProcessing(false);
      return;
    } catch (e) {
      if (!isUnreachable(e)) {
        addToast(e instanceof Error ? e.message : 'Failed to convert.', 'error');
        setIsProcessing(false);
        return;
      }
    }

    if (paragraphs.length === 0) { setIsProcessing(false); return; }
    try {
      const blob = await buildDocx(paragraphs);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, '') + '.docx';
      a.click();
      URL.revokeObjectURL(url);
      addToast('Word document downloaded', 'success');
    } catch (e) {
      console.error(e);
      addToast('Error building .docx', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => { setFile(null); setParagraphs([]); setProgress(0); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) loadPdf(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><FileText size={14} /> PDF to Word</div>
          <h1 className="section-title">PDF to <span className="gradient-text">Word</span></h1>
          <p className="section-subtitle">Convert PDFs into editable .docx documents with layout preserved. Files are converted securely and never stored.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to convert to Word</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ maxWidth: 680, margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            {isProcessing && paragraphs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                <Loader2 className="spinner" style={{ width: 28, height: 28, marginBottom: 10 }} />
                <div>Extracting text… {progress}%</div>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: 320, overflow: 'auto', background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', lineHeight: 1.7 }}>
                  {paragraphs.slice(0, 200).map((p, i) => (
                    <p key={i} style={{ margin: '0 0 6px', fontWeight: p.heading ? 700 : 400 }}>{p.text || ' '}</p>
                  ))}
                  {paragraphs.length > 200 && <p style={{ color: 'var(--text-muted)' }}>… {paragraphs.length - 200} more paragraphs</p>}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>High-fidelity conversion keeps layout and images. The preview above shows extracted text only.</span>
                </div>

                <button className="btn btn-primary" onClick={downloadDocx} disabled={isProcessing} style={{ width: '100%' }}>
                  {isProcessing ? <><Loader2 className="spinner" /> Working...</> : <><Download size={18} /> Download .docx</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
