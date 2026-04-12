'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '../components/ui/Toast';
import { Lock, Upload, FileText, Download, Loader2, ListRestart, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function ProtectPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
  }, []);

  const protectPdf = async () => {
    if (!file || !password) return;
    setIsProcessing(true);

    try {
      const ab = await file.arrayBuffer();
      const pdf = await PDFDocument.load(ab, { ignoreEncryption: true });

      // NOTE: pdf-lib does not support AES/RC4 PDF encryption.
      // We embed the password as a metadata keyword so the intent is
      // preserved, but this does NOT prevent the file from being opened
      // without a password in a standard PDF viewer.
      pdf.setTitle(file.name.replace('.pdf', ''));
      pdf.setKeywords([`password-hint:${password}`]);
      pdf.setProducer('TouchPDF');

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_protected.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      addToast('Downloaded — see the important notice above.', 'info');
    } catch (err) {
      console.error(err);
      addToast('Error processing PDF', 'error');
    }
    finally { setIsProcessing(false); }
  };

  const reset = () => { setFile(null); setPassword(''); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div className="wrapper animate-in" style={{ paddingTop: 40 }}>
        <div className="section-header">
          <div className="section-badge"><Lock size={14} /> Protect</div>
          <h1 className="section-title">Protect <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">Add a password hint to your PDF document.</p>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto 24px', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong style={{ color: '#eab308' }}>Limited protection:</strong> The pdf-lib library used here does not support AES/RC4 PDF encryption. The downloaded file will <em>not</em> require a password to open in standard PDF viewers. For real password protection use Adobe Acrobat, LibreOffice, or a dedicated encryption tool.
          </div>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop PDF here</strong> to protect</div>
            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="animate-in" style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ width: 44, height: 44, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={22} /></div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{file.name}</div></div>
                <button className="btn btn-ghost" onClick={reset} style={{ padding: 8 }}><ListRestart size={18} /></button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Set Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Enter a strong password"
                    style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem' }}
                  />
                  <button onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary" onClick={protectPdf} disabled={isProcessing || !password}
                style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
                {isProcessing ? <><Loader2 className="spinner" /> Processing...</> : <><Lock size={18} /> Add Hint & Download</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
