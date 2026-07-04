'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Unlock, Upload, Loader2, X, Eye, EyeOff, KeyRound } from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import { useToast } from '../components/ui/Toast';

export default function UnlockPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const download = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const process = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const pdfjs = await initPdfWorker();
      const data = new Uint8Array(await file.arrayBuffer());

      let srcDoc;
      try {
        srcDoc = await pdfjs.getDocument({ data, password: password || undefined }).promise;
      } catch (err) {
        if ((err as Error)?.name === 'PasswordException') {
          setNeedsPassword(true);
          addToast(password ? 'Incorrect password — try again' : 'This PDF requires a password', 'error');
          return;
        }
        throw err;
      }
      setNeedsPassword(false);

      const outName = file.name.replace('.pdf', '-unlocked.pdf');

      // Fast path for PDFs that open without a user password (restriction-only
      // locks): pdf-lib re-saves them without encryption, keeping vector content.
      if (!password) {
        try {
          const raw = new Uint8Array(await file.arrayBuffer());
          const direct = await PDFDocument.load(raw, { ignoreEncryption: true });
          const bytes = await direct.save();
          // Sanity check: the re-saved copy must still open in pdf.js.
          await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
          download(bytes, outName);
          addToast('Restrictions removed — PDF unlocked', 'success');
          return;
        } catch { /* fall back to rasterizing below */ }
      }

      // Robust path: re-render each decrypted page into a brand-new PDF.
      // Output is image-based (text selection is lost), but it opens anywhere
      // without a password.
      const newPdf = await PDFDocument.create();
      for (let i = 1; i <= srcDoc.numPages; i++) {
        setProgress(Math.round((i / srcDoc.numPages) * 100));
        const page = await srcDoc.getPage(i);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport: vp } as any).promise;

        const imgBytes = await fetch(canvas.toDataURL('image/jpeg', 0.92)).then(r => r.arrayBuffer());
        const img = await newPdf.embedJpg(new Uint8Array(imgBytes));
        const p = newPdf.addPage([vp.width / 2, vp.height / 2]);
        p.drawImage(img, { x: 0, y: 0, width: vp.width / 2, height: vp.height / 2 });
      }

      const out = await newPdf.save();
      download(out, outName);
      addToast(`Unlocked ${srcDoc.numPages} pages`, 'success');
    } catch (e) {
      console.error(e);
      addToast('Error unlocking PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => { setFile(null); setPassword(''); setNeedsPassword(false); setProgress(0); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Unlock size={14} /> Unlock PDF</div>
          <h1 className="section-title">Unlock <span className="gradient-text">PDF</span></h1>
          <p className="section-subtitle">Remove passwords and restrictions from PDFs you own. The file and password never leave your browser.</p>
        </div>

        {!file ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop a locked PDF here</strong> to remove its password</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ maxWidth: 520, margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{file.name}</strong>
              <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Password {needsPassword ? <span style={{ color: 'var(--danger)' }}>(required for this PDF)</span> : '(leave empty if the PDF opens without one)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="PDF password"
                  style={{ width: '100%', padding: '10px 44px 10px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                />
                <button onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16, fontStyle: 'italic' }}>
              Note: password-encrypted PDFs are rebuilt page by page, so the unlocked copy is image-based (text can no longer be selected).
            </p>

            {isProcessing && (
              <div className="progress-bar" style={{ marginBottom: 12 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            <button className="btn btn-primary" onClick={process} disabled={isProcessing} style={{ width: '100%' }}>
              {isProcessing ? <><Loader2 className="spinner" /> Unlocking... {progress}%</> : <><KeyRound size={18} /> Unlock & Download</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
