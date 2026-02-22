'use client';

import { useState, useRef, useCallback } from 'react';
import { ImageDown, Upload, Download, Loader2, X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function ImageCompressorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [format, setFormat] = useState<'jpeg' | 'webp'>('jpeg');
  const [results, setResults] = useState<{ name: string; original: number; compressed: number; url: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    setFiles(Array.from(fl).filter(f => f.type.startsWith('image/')));
    setResults([]);
  };

  const compress = useCallback(async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    const res: typeof results = [];

    for (const file of files) {
      const imgEl = document.createElement('img');
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve) => { imgEl.onload = () => resolve(); imgEl.src = url; });

      let w = imgEl.width;
      let h = imgEl.height;
      if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imgEl, 0, 0, w, h);
      URL.revokeObjectURL(url);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(b => resolve(b!), `image/${format}`, quality);
      });

      const dlUrl = URL.createObjectURL(blob);
      res.push({ name: file.name.replace(/\.\w+$/, `.${format === 'jpeg' ? 'jpg' : 'webp'}`), original: file.size, compressed: blob.size, url: dlUrl });
    }

    setResults(res);
    setIsProcessing(false);
    addToast(`Compressed ${res.length} image(s)`, 'success');
  }, [files, quality, maxWidth, format, addToast]);

  const downloadAll = () => {
    results.forEach(r => {
      const a = document.createElement('a'); a.href = r.url; a.download = r.name; a.click();
    });
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); };
  const fieldStyle = { padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem', width: '100%' } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><ImageDown size={14} /> Image Compressor</div>
          <h1 className="section-title">Compress <span className="gradient-text">Images</span></h1>
          <p className="section-subtitle">Reduce image file sizes with adjustable quality. Supports JPG, PNG, WebP. 100% client-side.</p>
        </div>

        {files.length === 0 ? (
          <div className={`drop-zone ${dragActive ? 'active' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop}>
            <div className="drop-zone-icon"><Upload size={48} strokeWidth={1} /></div>
            <div className="drop-zone-text"><strong>Drop images here</strong> (JPG, PNG, WebP)</div>
            <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          </div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong>{files.length} image(s) selected</strong>
              <button onClick={() => { setFiles([]); setResults([]); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Quality ({Math.round(quality * 100)}%)</label>
                <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={e => setQuality(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Max Width (px)</label>
                <input type="number" value={maxWidth} onChange={e => setMaxWidth(Number(e.target.value))} min={100} style={fieldStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Format</label>
                <select value={format} onChange={e => setFormat(e.target.value as typeof format)} style={fieldStyle}>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>

            {results.length === 0 ? (
              <button className="btn btn-primary" onClick={compress} disabled={isProcessing} style={{ width: '100%' }}>
                {isProcessing ? <><Loader2 className="spinner" /> Compressing...</> : <><ImageDown size={18} /> Compress Images</>}
              </button>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  {results.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.82rem' }}>
                      <span>{r.name}</span>
                      <span style={{ color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                        {(r.original / 1024).toFixed(0)}KB → {(r.compressed / 1024).toFixed(0)}KB ({Math.round((1 - r.compressed / r.original) * 100)}% saved)
                      </span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={downloadAll} style={{ width: '100%' }}>
                  <Download size={18} /> Download All
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
