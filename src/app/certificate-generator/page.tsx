'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import { Award, Download, Loader2 } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const TEMPLATES = [
  { name: 'Classic', accent: [41, 128, 185] },
  { name: 'Elegant Gold', accent: [183, 149, 72] },
  { name: 'Modern Teal', accent: [0, 128, 128] },
  { name: 'Royal Purple', accent: [106, 27, 154] },
];

export default function CertificatePage() {
  const [recipientName, setRecipientName] = useState('');
  const [title, setTitle] = useState('Certificate of Achievement');
  const [description, setDescription] = useState('This is to certify that');
  const [reason, setReason] = useState('outstanding performance and dedication');
  const [issuer, setIssuer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [templateIdx, setTemplateIdx] = useState(0);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  const generate = () => {
    if (!recipientName) { addToast('Please enter recipient name', 'error'); return; }
    setIsGenerating(true);
    try {
      const isLand = orientation === 'landscape';
      const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
      const w = isLand ? 297 : 210;
      const h = isLand ? 210 : 297;
      const [r, g, b] = TEMPLATES[templateIdx].accent;

      // Border
      pdf.setDrawColor(r, g, b); pdf.setLineWidth(2);
      pdf.rect(10, 10, w - 20, h - 20);
      pdf.setLineWidth(0.5);
      pdf.rect(14, 14, w - 28, h - 28);

      // Decorative corners
      const cornerSize = 15;
      pdf.setLineWidth(1.5);
      [[14, 14, 1, 1], [w - 14, 14, -1, 1], [14, h - 14, 1, -1], [w - 14, h - 14, -1, -1]].forEach(([cx, cy, dx, dy]) => {
        pdf.line(cx as number, cy as number, (cx as number) + cornerSize * (dx as number), cy as number);
        pdf.line(cx as number, cy as number, cx as number, (cy as number) + cornerSize * (dy as number));
      });

      let y = isLand ? 45 : 60;

      // Title
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(isLand ? 28 : 24);
      pdf.setTextColor(r, g, b);
      pdf.text(title, w / 2, y, { align: 'center' }); y += 12;

      // Decorative line
      pdf.setDrawColor(r, g, b); pdf.setLineWidth(0.5);
      pdf.line(w / 2 - 40, y, w / 2 + 40, y); y += 12;

      // Description
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(14); pdf.setTextColor(80, 80, 80);
      pdf.text(description, w / 2, y, { align: 'center' }); y += 14;

      // Recipient Name
      pdf.setFont('helvetica', 'bolditalic'); pdf.setFontSize(isLand ? 32 : 26);
      pdf.setTextColor(r, g, b);
      pdf.text(recipientName, w / 2, y, { align: 'center' }); y += 12;

      // Underline
      const nameWidth = pdf.getTextWidth(recipientName);
      pdf.setDrawColor(r, g, b); pdf.setLineWidth(0.3);
      pdf.line(w / 2 - nameWidth / 2, y - 2, w / 2 + nameWidth / 2, y - 2); y += 10;

      // Reason
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(12); pdf.setTextColor(80, 80, 80);
      const reasonLines = pdf.splitTextToSize(`for ${reason}`, w - 80);
      pdf.text(reasonLines, w / 2, y, { align: 'center' }); y += reasonLines.length * 6 + 16;

      // Date & Issuer
      const bottomY = isLand ? h - 45 : h - 60;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      if (date) {
        pdf.text(`Date: ${date}`, w / 2 - 50, bottomY, { align: 'center' });
        pdf.setLineWidth(0.3); pdf.line(w / 2 - 80, bottomY + 2, w / 2 - 20, bottomY + 2);
      }
      if (issuer) {
        pdf.text(issuer, w / 2 + 50, bottomY, { align: 'center' });
        pdf.setLineWidth(0.3); pdf.line(w / 2 + 20, bottomY + 2, w / 2 + 80, bottomY + 2);
        pdf.setFontSize(8); pdf.text('Authorized Signature', w / 2 + 50, bottomY + 7, { align: 'center' });
      }

      pdf.save(`Certificate_${recipientName.replace(/\s+/g, '_')}.pdf`);
      addToast('Certificate generated!', 'success');
    } catch (e) { console.error(e); addToast('Error generating certificate', 'error'); }
    finally { setIsGenerating(false); }
  };

  const fieldStyle = { padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem', width: '100%' } as const;
  const labelStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Award size={14} /> Certificate</div>
          <h1 className="section-title">Certificate <span className="gradient-text">Generator</span></h1>
          <p className="section-subtitle">Generate beautiful certificates for achievements, completions, or participation in seconds.</p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={labelStyle}>Recipient Name *</label><input value={recipientName} onChange={e => setRecipientName(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Certificate Title</label><input value={title} onChange={e => setTitle(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Description Line</label><input value={description} onChange={e => setDescription(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Reason / Achievement</label><input value={reason} onChange={e => setReason(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Issued By</label><input value={issuer} onChange={e => setIssuer(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={fieldStyle} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Template</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TEMPLATES.map((t, i) => (
                  <button key={t.name} onClick={() => setTemplateIdx(i)} style={{
                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
                    border: templateIdx === i ? '2px solid var(--accent-1)' : '1px solid var(--glass-border)',
                    background: `rgb(${t.accent.join(',')})`, color: '#fff'
                  }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Orientation</label>
              <select value={orientation} onChange={e => setOrientation(e.target.value as typeof orientation)} style={fieldStyle}>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={generate} disabled={isGenerating} style={{ width: '100%' }}>
            {isGenerating ? <><Loader2 className="spinner" /> Generating...</> : <><Download size={18} /> Generate Certificate</>}
          </button>
        </div>
      </div>
    </div>
  );
}
