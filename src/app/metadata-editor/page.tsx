'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileText, Upload, Download, Loader2, X, Save } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function MetadataEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [creator, setCreator] = useState('');
  const [producer, setProducer] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadPdf = async (f: File) => {
    setFile(f);
    try {
      const data = await f.arrayBuffer();
      const pdf = await PDFDocument.load(data);
      setTitle(pdf.getTitle() || '');
      setAuthor(pdf.getAuthor() || '');
      setSubject(pdf.getSubject() || '');
      setKeywords((pdf.getKeywords() || ''));
      setCreator(pdf.getCreator() || '');
      setProducer(pdf.getProducer() || '');
      const cd = pdf.getCreationDate();
      setCreationDate(cd ? cd.toISOString().split('T')[0] : '');
    } catch (e) { console.error(e); addToast('Error reading PDF metadata', 'error'); }
  };

  const save = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const pdf = await PDFDocument.load(data);
      if (title) pdf.setTitle(title);
      if (author) pdf.setAuthor(author);
      if (subject) pdf.setSubject(subject);
      if (keywords) pdf.setKeywords(keywords.split(',').map(k => k.trim()));
      if (creator) pdf.setCreator(creator);
      if (producer) pdf.setProducer(producer);

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name.replace('.pdf', '-metadata.pdf'); a.click();
      URL.revokeObjectURL(url);
      addToast('Metadata updated & saved', 'success');
    } catch (e) { console.error(e); addToast('Error saving PDF', 'error'); }
    finally { setIsProcessing(false); }
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) loadPdf(e.dataTransfer.files[0]); };

  const fieldStyle = { width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem' } as const;
  const labelStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><FileText size={14} /> Metadata Editor</div>
          <h1 className="section-title">PDF <span className="gradient-text">Metadata Editor</span></h1>
          <p className="section-subtitle">View and edit title, author, subject, keywords, and other metadata of your PDF.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to view & edit metadata</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <strong>{file.name}</strong>
              <button onClick={() => { setFile(null); setTitle(''); setAuthor(''); setSubject(''); setKeywords(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={labelStyle}>Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Author</label><input type="text" value={author} onChange={e => setAuthor(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Subject</label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Keywords (comma-separated)</label><input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Creator</label><input type="text" value={creator} onChange={e => setCreator(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Producer</label><input type="text" value={producer} onChange={e => setProducer(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Creation Date</label><input type="text" value={creationDate} readOnly style={{ ...fieldStyle, opacity: 0.5 }} /></div>
            </div>

            <button className="btn btn-primary" onClick={save} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Saving...</> : <><Save size={18} /> Save Metadata & Download</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
