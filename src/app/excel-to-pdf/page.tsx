'use client';

import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import { FileSpreadsheet, Upload, Download, Loader2, X, Info } from 'lucide-react';
import { parseXlsx, SheetData } from '../lib/ooxml';
import { useToast } from '../components/ui/Toast';
import { serverConvert, downloadBlob, isUnreachable } from '../lib/api';

export default function ExcelToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadFile = async (f: File) => {
    if (!f.name.match(/\.xlsx$/i)) {
      addToast('Please upload a .xlsx file', 'error');
      return;
    }
    setFile(f);
    setSheets([]);
    setIsProcessing(true);
    try {
      const parsed = await parseXlsx(await f.arrayBuffer());
      const nonEmpty = parsed.filter(s => s.rows.some(r => r.some(c => c !== '')));
      setSheets(nonEmpty);
      if (nonEmpty.length === 0) addToast('No data found in this workbook', 'info');
    } catch (e) {
      console.error(e);
      addToast('Could not read this file — is it a valid .xlsx?', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    // True conversion on our server (LibreOffice): real cell formatting,
    // column widths and styling. Falls back to the simple table renderer
    // below when the server can't be reached.
    try {
      const blob = await serverConvert(file, 'pdf');
      downloadBlob(blob, file.name.replace(/\.xlsx$/i, '') + '.pdf');
      addToast('PDF downloaded', 'success');
      setIsProcessing(false);
      return;
    } catch (e) {
      if (!isUnreachable(e)) {
        addToast(e instanceof Error ? e.message : 'Error generating PDF', 'error');
        setIsProcessing(false);
        return;
      }
    }

    if (sheets.length === 0) { setIsProcessing(false); return; }
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = 297, pageH = 210, margin = 12;
      const rowH = 7;

      sheets.forEach((sheet, si) => {
        if (si > 0) pdf.addPage();
        let y = margin;

        // Sheet title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.text(sheet.name, margin, y + 4);
        y += 10;

        const cols = Math.max(1, ...sheet.rows.map(r => r.length));
        const colW = (pageW - margin * 2) / cols;

        pdf.setFontSize(8);
        sheet.rows.forEach((row, ri) => {
          if (y + rowH > pageH - margin) {
            pdf.addPage();
            y = margin;
          }
          const isHeader = ri === 0;
          if (isHeader) {
            pdf.setFillColor(238, 238, 244);
            pdf.rect(margin, y, pageW - margin * 2, rowH, 'F');
          }
          pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
          pdf.setDrawColor(210);
          for (let ci = 0; ci < cols; ci++) {
            const x = margin + ci * colW;
            pdf.rect(x, y, colW, rowH);
            const val = row[ci] || '';
            if (val) {
              // clip long values to the cell width
              const clipped = pdf.splitTextToSize(val, colW - 3)[0] || '';
              pdf.text(clipped, x + 1.5, y + rowH - 2.2);
            }
          }
          y += rowH;
        });
      });

      pdf.save(file.name.replace(/\.xlsx$/i, '') + '.pdf');
      addToast('PDF downloaded', 'success');
    } catch (e) {
      console.error(e);
      addToast('Error generating PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => { setFile(null); setSheets([]); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]); };

  const preview = sheets[0]?.rows.slice(0, 10) || [];
  const maxCols = Math.max(1, ...preview.map(r => r.length));

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><FileSpreadsheet size={14} /> Excel to PDF</div>
          <h1 className="section-title">Excel to <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">True .xlsx to PDF conversion with real formatting preserved. Files are converted securely and never stored.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop .xlsx here</strong> to convert to PDF</div>
            <input ref={inputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
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
                <div>Reading workbook…</div>
              </div>
            ) : sheets.length > 0 ? (
              <>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  {sheets.length} sheet(s) — preview of “{sheets[0].name}”
                </div>
                <div style={{ overflowX: 'auto', marginBottom: 16, border: '1px solid var(--glass-border)', borderRadius: 8 }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.75rem' }}>
                    <tbody>
                      {preview.map((row, ri) => (
                        <tr key={ri} style={ri === 0 ? { fontWeight: 700 } : undefined}>
                          {Array.from({ length: maxCols }, (_, ci) => (
                            <td key={ci} style={{ border: '1px solid var(--glass-border)', padding: '4px 8px', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                  <span>Cell values and sheet structure are converted; formulas are exported as their computed values, charts and styling are not included.</span>
                </div>

                <button className="btn btn-primary" onClick={generatePdf} disabled={isProcessing} style={{ width: '100%' }}>
                  {isProcessing ? <><Loader2 className="spinner" /> Working...</> : <><Download size={18} /> Convert to PDF</>}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
