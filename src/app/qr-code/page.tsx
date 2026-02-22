'use client';

import { useState, useRef } from 'react';
import jsQR from 'jsqr';
import { QrCode, Download, Copy, Check, Upload, ScanLine } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

type Mode = 'create' | 'scan';

export default function QrCodePage() {
  const [mode, setMode] = useState<Mode>('create');
  const [text, setText] = useState('https://');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#1a1a2e');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const qrUrl = text.length > 0
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`
    : null;

  const downloadQr = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${size}.png`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('QR code downloaded', 'success');
    } catch {
      addToast('Error downloading QR code', 'error');
    }
  };

  const copyToClipboard = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast('Copied to clipboard', 'success');
    } catch {
      addToast('Could not copy to clipboard', 'error');
    }
  };

  const handleScanUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file', 'error');
      return;
    }
    setIsScanning(true);
    setUploadPreview(URL.createObjectURL(file));

    try {
      const imgEl = document.createElement('img');
      const loadPromise = new Promise<void>((resolve) => {
        imgEl.onload = () => resolve();
      });
      imgEl.src = URL.createObjectURL(file);
      await loadPromise;

      const canvas = document.createElement('canvas');
      canvas.width = imgEl.width;
      canvas.height = imgEl.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imgEl, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const result = jsQR(imageData.data, imageData.width, imageData.height);

      if (result) {
        setScannedData(result.data);
        setText(result.data);
        addToast(`QR decoded: "${result.data.slice(0, 60)}${result.data.length > 60 ? '...' : ''}"`, 'success');
      } else {
        setScannedData(null);
        addToast('Could not detect a QR code in the image. Try a clearer photo.', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error scanning image', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const fieldStyle = {
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--glass-border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    width: '100%',
  } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><QrCode size={14} /> QR Code</div>
          <h1 className="section-title">QR Code <span className="gradient-text">Generator</span></h1>
          <p className="section-subtitle">Create QR codes or scan existing ones to duplicate with new colors.</p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode('create')}
          >
            <QrCode size={14} /> Create QR
          </button>
          <button
            className={`btn ${mode === 'scan' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode('scan')}
          >
            <ScanLine size={14} /> Scan & Duplicate
          </button>
        </div>

        {/* Scan upload section */}
        {mode === 'scan' && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-2)', marginBottom: 12 }}>
              Upload a QR code image to extract its data
            </h3>

            <div
              className={`drop-zone`}
              onClick={() => scanInputRef.current?.click()}
              style={{ minHeight: 100 }}
            >
              {uploadPreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={uploadPreview} alt="uploaded QR" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 4 }} />
                  <div style={{ textAlign: 'left' }}>
                    {scannedData ? (
                      <>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>✓ QR Decoded</div>
                        <div style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          padding: '6px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 6,
                          fontFamily: 'JetBrains Mono, monospace',
                          maxWidth: 300,
                          wordBreak: 'break-all',
                        }}>
                          {scannedData.slice(0, 100)}{scannedData.length > 100 ? '...' : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                          Data copied to generator below — customize colors and download
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: 'var(--danger)' }}>No QR code detected — try a clearer image</div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="drop-zone-icon"><Upload size={36} strokeWidth={1} /></div>
                  <div className="drop-zone-text"><strong>Drop a QR code image</strong> or click to browse</div>
                </>
              )}
              <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files?.[0]) handleScanUpload(e.target.files[0]);
                  e.target.value = '';
                }}
              />
            </div>

            {scannedData && (
              <button
                className="btn btn-ghost"
                style={{ marginTop: 12, fontSize: '0.78rem' }}
                onClick={() => {
                  setUploadPreview(null);
                  setScannedData(null);
                }}
              >
                Scan Another
              </button>
            )}
          </div>
        )}

        {/* Generator + Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          {/* Settings */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            padding: 20,
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Content {scannedData && <span style={{ color: 'var(--success)', fontSize: '0.7rem' }}>● from scanned QR</span>}
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Enter URL, text, or any data..."
                rows={3}
                style={{ ...fieldStyle, fontFamily: 'JetBrains Mono, monospace', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Size (px)</label>
                <select value={size} onChange={e => setSize(Number(e.target.value))} style={fieldStyle}>
                  <option value={128}>128</option>
                  <option value={256}>256</option>
                  <option value={512}>512</option>
                  <option value={1024}>1024</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Foreground</label>
                <input
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  style={{ width: '100%', height: 38, border: '1px solid var(--glass-border)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Background</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{ width: '100%', height: 38, border: '1px solid var(--glass-border)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={downloadQr} style={{ flex: 1 }}>
                <Download size={16} /> Download PNG
              </button>
              <button className="btn btn-ghost" onClick={copyToClipboard}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius)',
            padding: 16,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            aspectRatio: '1',
          }}>
            {qrUrl && (
              <img
                src={qrUrl}
                alt="QR Code"
                style={{ width: '100%', height: 'auto', imageRendering: 'pixelated' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
