'use client';

import { useState, useRef } from 'react';
import { Table, Upload, Download, Loader2, X, Info } from 'lucide-react';
import { extractPageLines, lineToCells } from '../lib/pdf-text';
import { buildXlsx, SheetData } from '../lib/ooxml';
import { useToast } from '../components/ui/Toast';

export default function PdfToExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadPdf = async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setSheets([]);
    setIsProcessing(true);
    setProgress(0);
    try {
      const pages = await extractPageLines(await f.arrayBuffer(), setProgress);
      const result: SheetData[] = pages.map((lines, pi) => ({
        name: `Page ${pi + 1}`,
        rows: lines.map(l => lineToCells(l)).filter(r => r.length > 0),
      }));
      const nonEmpty = result.filter(s => s.rows.length > 0);
      setSheets(nonEmpty);
      if (nonEmpty.length === 0) addToast('No selectable text found — this PDF may be scanned images', 'info');
    } catch (e) {
      console.error(e);
      addToast('Error reading PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadXlsx = async () => {
    if (!file || sheets.length === 0) return;
    setIsProcessing(true);
    try {
      const blob = await buildXlsx(sheets);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, '') + '.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      addToast('Excel workbook downloaded', 'success');
    } catch (e) {
      console.error(e);
      addToast('Error building .xlsx', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => { setFile(null); setSheets([]); setProgress(0); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) loadPdf(e.dataTransfer.files[0]); };

  const preview = sheets[0]?.rows.slice(0, 12) || [];
  const maxCols = Math.max(1, ...preview.map(r => r.length));

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Table size={14} /> PDF to Excel</div>
          <h1 className="section-title">PDF to <span className="gradient-text">Excel</span></h1>
          <p className="section-subtitle">Extract table-like text from PDFs into an .xlsx workbook — one sheet per page, all in your browser.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to extract tables</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ maxWidth: 720, margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            {isProcessing && sheets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                <Loader2 className="spinner" style={{ width: 28, height: 28, marginBottom: 10 }} />
                <div>Analyzing layout… {progress}%</div>
              </div>
            ) : sheets.length > 0 ? (
              <>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Preview — {sheets[0].name} of {sheets.length} sheet(s)
                </div>
                <div style={{ overflowX: 'auto', marginBottom: 16, border: '1px solid var(--glass-border)', borderRadius: 8 }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.75rem' }}>
                    <tbody>
                      {preview.map((row, ri) => (
                        <tr key={ri}>
                          {Array.from({ length: maxCols }, (_, ci) => (
                            <td key={ci} style={{ border: '1px solid var(--glass-border)', padding: '4px 8px', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row[ci] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Columns are detected from horizontal gaps in the text. Works best on PDFs with real table layouts.</span>
                </div>

                <button className="btn btn-primary" onClick={downloadXlsx} disabled={isProcessing} style={{ width: '100%' }}>
                  {isProcessing ? <><Loader2 className="spinner" /> Working...</> : <><Download size={18} /> Download .xlsx</>}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No extractable text found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
