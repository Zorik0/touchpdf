'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import { Receipt, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

interface InvoiceItem { desc: string; qty: number; rate: number; }

export default function InvoicePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('INV-001');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ desc: '', qty: 1, rate: 0 }]);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [taxRate, setTaxRate] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const addItem = () => setItems(prev => [...prev, { desc: '', qty: 1, rate: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const generate = () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const w = 210; let y = 20; const m = 20;

      // Header
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(24);
      pdf.text('INVOICE', m, y); y += 4;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      pdf.text(invoiceNo, m, y + 6);
      pdf.text(`Date: ${date}`, w - m, y, { align: 'right' }); y += 6;
      if (dueDate) { pdf.text(`Due: ${dueDate}`, w - m, y, { align: 'right' }); }
      y += 10;

      // From / To
      pdf.setDrawColor(200); pdf.setLineWidth(0.3); pdf.line(m, y, w - m, y); y += 6;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text('FROM', m, y); pdf.text('TO', w / 2 + 5, y); y += 5;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      from.split('\n').forEach(line => { pdf.text(line, m, y); y += 5; });
      let y2 = y - from.split('\n').length * 5;
      to.split('\n').forEach(line => { pdf.text(line, w / 2 + 5, y2); y2 += 5; });
      y = Math.max(y, y2) + 8;

      // Table header
      pdf.setFillColor(245, 245, 245); pdf.rect(m, y - 4, w - m * 2, 8, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
      pdf.text('Description', m + 2, y); pdf.text('Qty', 130, y); pdf.text('Rate', 150, y); pdf.text('Amount', 175, y); y += 6;

      // Items
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      items.filter(i => i.desc).forEach(item => {
        if (y > 265) { pdf.addPage(); y = 20; }
        const amount = item.qty * item.rate;
        pdf.text(item.desc, m + 2, y);
        pdf.text(String(item.qty), 130, y);
        pdf.text(`${currency}${item.rate.toFixed(2)}`, 150, y);
        pdf.text(`${currency}${amount.toFixed(2)}`, 175, y);
        y += 6;
      });

      // Totals
      y += 4;
      pdf.setDrawColor(200); pdf.line(m, y, w - m, y); y += 6;
      pdf.text(`Subtotal: ${currency}${subtotal.toFixed(2)}`, w - m, y, { align: 'right' }); y += 5;
      if (taxRate > 0) { pdf.text(`Tax (${taxRate}%): ${currency}${tax.toFixed(2)}`, w - m, y, { align: 'right' }); y += 5; }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
      pdf.text(`Total: ${currency}${total.toFixed(2)}`, w - m, y + 2, { align: 'right' }); y += 12;

      // Notes
      if (notes) {
        pdf.setFont('helvetica', 'italic'); pdf.setFontSize(9); pdf.setTextColor(120);
        const lines = pdf.splitTextToSize(`Notes: ${notes}`, w - m * 2);
        pdf.text(lines, m, y);
      }

      pdf.save(`Invoice_${invoiceNo}.pdf`);
      addToast('Invoice generated!', 'success');
    } catch (e) { console.error(e); addToast('Error generating invoice', 'error'); }
    finally { setIsGenerating(false); }
  };

  const fieldStyle = { padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem', width: '100%' } as const;
  const labelStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><Receipt size={14} /> Invoice</div>
          <h1 className="section-title">Invoice <span className="gradient-text">Generator</span></h1>
          <p className="section-subtitle">Create professional invoices in seconds. Fill in details, add line items, and download as PDF.</p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div><label style={labelStyle}>From (your details)</label><textarea value={from} onChange={e => setFrom(e.target.value)} rows={3} placeholder="Company Name&#10;Address&#10;Email" style={{ ...fieldStyle, resize: 'vertical' }} /></div>
            <div><label style={labelStyle}>Bill To</label><textarea value={to} onChange={e => setTo(e.target.value)} rows={3} placeholder="Client Name&#10;Address&#10;Email" style={{ ...fieldStyle, resize: 'vertical' }} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><label style={labelStyle}>Invoice #</label><input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} style={fieldStyle}>
              <option value="₹">₹ INR</option><option value="$">$ USD</option><option value="€">€ EUR</option><option value="£">£ GBP</option>
            </select></div>
          </div>

          {/* Line items */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontSize: '0.82rem', color: 'var(--accent-2)', fontWeight: 600 }}>Line Items</h3>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={addItem}><Plus size={12} /> Add Item</button>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 6, alignItems: 'end' }}>
              <div><label style={labelStyle}>Description</label><input value={item.desc} onChange={e => updateItem(i, 'desc', e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Qty</label><input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} min={1} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Rate</label><input type="number" value={item.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))} min={0} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Amount</label><input readOnly value={`${currency}${(item.qty * item.rate).toFixed(2)}`} style={{ ...fieldStyle, opacity: 0.6 }} /></div>
              <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px' }}><Trash2 size={14} /></button>
            </div>
          ))}

          {/* Totals row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, marginBottom: 16 }}>
            <div><label style={labelStyle}>Tax Rate (%)</label><input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} min={0} max={100} style={fieldStyle} /></div>
            <div style={{ textAlign: 'right', paddingTop: 20 }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Subtotal: {currency}{subtotal.toFixed(2)}</div>
              {taxRate > 0 && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tax: {currency}{tax.toFixed(2)}</div>}
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-2)' }}>Total: {currency}{total.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Payment terms, bank details, etc." style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>

          <button className="btn btn-primary" onClick={generate} disabled={isGenerating} style={{ width: '100%' }}>
            {isGenerating ? <><Loader2 className="spinner" /> Generating...</> : <><Download size={18} /> Generate Invoice PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}
