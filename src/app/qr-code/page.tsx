'use client';

import { useState, useRef, useEffect } from 'react';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function QrCodePage() {
  const [text, setText] = useState('https://');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#1a1a2e');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addToast } = useToast();

  // Simple QR code generator using canvas (no external lib)
  // Using the QR code encoding from scratch is complex, so we'll use a lightweight approach
  // with the Google Charts API rendered client-side via an img element
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`;

  const downloadQr = async () => {
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

  const fieldStyle = { padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem', width: '100%' } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><QrCode size={14} /> QR Code</div>
          <h1 className="section-title">QR Code <span className="gradient-text">Generator</span></h1>
          <p className="section-subtitle">Generate QR codes for URLs, text, or any data. Download as PNG or copy to clipboard.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          {/* Settings */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Content</label>
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
                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} style={{ width: '100%', height: 38, border: '1px solid var(--glass-border)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Background</label>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '100%', height: 38, border: '1px solid var(--glass-border)', borderRadius: 8, background: 'transparent', cursor: 'pointer' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={downloadQr} style={{ flex: 1 }}><Download size={16} /> Download PNG</button>
              <button className="btn btn-ghost" onClick={copyToClipboard}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}</button>
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius)', padding: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', aspectRatio: '1' }}>
            {text.length > 0 && (
              <img src={qrUrl} alt="QR Code" style={{ width: '100%', height: 'auto', imageRendering: 'pixelated' }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
