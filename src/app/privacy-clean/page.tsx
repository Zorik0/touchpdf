'use client';

import { useState, useRef } from 'react';
import { PDFDocument, PDFName } from 'pdf-lib';
import { EyeOff, Upload, Download, Loader2, X, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

interface MetaField { label: string; value: string; }

export default function PrivacyCleanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [found, setFound] = useState<MetaField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadPdf = async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setFound([]);
    try {
      const data = await f.arrayBuffer();
      const pdf = await PDFDocument.load(data, { ignoreEncryption: true });
      const fields: MetaField[] = [];
      const add = (label: string, value?: string) => { if (value) fields.push({ label, value }); };
      add('Title', pdf.getTitle());
      add('Author', pdf.getAuthor());
      add('Subject', pdf.getSubject());
      add('Keywords', pdf.getKeywords());
      add('Creator', pdf.getCreator());
      add('Producer', pdf.getProducer());
      add('Created', pdf.getCreationDate()?.toISOString());
      add('Modified', pdf.getModificationDate()?.toISOString());
      if (pdf.catalog.get(PDFName.of('Metadata'))) add('XMP Metadata', 'embedded XML metadata stream');
      setFound(fields);
    } catch (e) {
      console.error(e);
      addToast('Error reading PDF', 'error');
    }
  };

  const clean = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const pdf = await PDFDocument.load(data, { ignoreEncryption: true });

      // Wipe the document information dictionary
      pdf.setTitle('');
      pdf.setAuthor('');
      pdf.setSubject('');
      pdf.setKeywords([]);
      pdf.setCreator('');
      pdf.setProducer('');
      const epoch = new Date(0);
      pdf.setCreationDate(epoch);
      pdf.setModificationDate(epoch);

      // Remove the XMP metadata stream, which often duplicates author/tool info
      pdf.catalog.delete(PDFName.of('Metadata'));

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', '-clean.pdf');
      a.click();
      URL.revokeObjectURL(url);
      addToast('Metadata removed — clean copy downloaded', 'success');
    } catch (e) {
      console.error(e);
      addToast('Error cleaning PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => { setFile(null); setFound([]); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) loadPdf(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><EyeOff size={14} /> Privacy Cleaner</div>
          <h1 className="section-title">Privacy <span className="gradient-text">Cleaner</span></h1>
          <p className="section-subtitle">Strip hidden metadata — author, creation tool, timestamps, and embedded XMP — before sharing a PDF. 100% on your device.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to inspect & remove metadata</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ maxWidth: 560, margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-2)' }}>
                {found.length > 0 ? `Found ${found.length} metadata field(s):` : 'No visible metadata found (hidden fields will still be wiped).'}
              </div>
              {found.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 110 }}>{f.label}</span>
                  <span style={{ wordBreak: 'break-all' }}>{f.value.slice(0, 120)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Removes the info dictionary and XMP metadata stream. Content, annotations, and attachments are left untouched.</span>
            </div>

            <button className="btn btn-primary" onClick={clean} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Cleaning...</> : <><Download size={18} /> Remove Metadata & Download</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
