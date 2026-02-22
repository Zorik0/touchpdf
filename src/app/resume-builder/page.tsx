'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import { FileUser, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

interface Education { school: string; degree: string; year: string; }
interface Experience { company: string; role: string; period: string; desc: string; }

export default function ResumePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [education, setEducation] = useState<Education[]>([{ school: '', degree: '', year: '' }]);
  const [experience, setExperience] = useState<Experience[]>([{ company: '', role: '', period: '', desc: '' }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  const addEdu = () => setEducation(prev => [...prev, { school: '', degree: '', year: '' }]);
  const addExp = () => setExperience(prev => [...prev, { company: '', role: '', period: '', desc: '' }]);
  const removeEdu = (i: number) => setEducation(prev => prev.filter((_, idx) => idx !== i));
  const removeExp = (i: number) => setExperience(prev => prev.filter((_, idx) => idx !== i));
  const updateEdu = (i: number, field: keyof Education, value: string) => setEducation(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  const updateExp = (i: number, field: keyof Experience, value: string) => setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));

  const generate = () => {
    if (!name) { addToast('Please enter your name', 'error'); return; }
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const w = 210; let y = 20; const margin = 20;

      // Name
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22);
      pdf.text(name, w / 2, y, { align: 'center' }); y += 8;

      // Contact
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      const contact = [email, phone, location].filter(Boolean).join(' • ');
      if (contact) { pdf.text(contact, w / 2, y, { align: 'center' }); y += 8; }

      // Divider
      pdf.setDrawColor(180); pdf.setLineWidth(0.3); pdf.line(margin, y, w - margin, y); y += 6;

      // Summary
      if (summary) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text('SUMMARY', margin, y); y += 6;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(summary, w - margin * 2);
        pdf.text(lines, margin, y); y += lines.length * 5 + 4;
      }

      // Experience
      if (experience.some(e => e.company)) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text('EXPERIENCE', margin, y); y += 6;
        experience.filter(e => e.company).forEach(exp => {
          if (y > 270) { pdf.addPage(); y = 20; }
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text(exp.role || 'Role', margin, y);
          pdf.setFont('helvetica', 'normal'); pdf.text(exp.period, w - margin, y, { align: 'right' }); y += 5;
          pdf.setFont('helvetica', 'italic'); pdf.text(exp.company, margin, y); y += 5;
          if (exp.desc) {
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
            const lines = pdf.splitTextToSize(exp.desc, w - margin * 2 - 5);
            pdf.text(lines, margin + 3, y); y += lines.length * 4 + 3;
          }
          y += 2;
        });
      }

      // Education
      if (education.some(e => e.school)) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text('EDUCATION', margin, y); y += 6;
        education.filter(e => e.school).forEach(edu => {
          if (y > 270) { pdf.addPage(); y = 20; }
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text(edu.degree || 'Degree', margin, y);
          pdf.setFont('helvetica', 'normal'); pdf.text(edu.year, w - margin, y, { align: 'right' }); y += 5;
          pdf.setFont('helvetica', 'italic'); pdf.text(edu.school, margin, y); y += 7;
        });
      }

      // Skills
      if (skills) {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text('SKILLS', margin, y); y += 6;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(skills, w - margin * 2);
        pdf.text(lines, margin, y);
      }

      pdf.save(`${name.replace(/\s+/g, '_')}_Resume.pdf`);
      addToast('Resume generated!', 'success');
    } catch (e) { console.error(e); addToast('Error generating resume', 'error'); }
    finally { setIsGenerating(false); }
  };

  const fieldStyle = { padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem', width: '100%' } as const;
  const labelStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 } as const;

  return (
    <div className="page-container">
      <div style={{ paddingTop: 20 }} className="animate-in">
        <div className="section-header">
          <div className="section-badge"><FileUser size={14} /> Resume Builder</div>
          <h1 className="section-title">Resume <span className="gradient-text">to PDF</span></h1>
          <p className="section-subtitle">Fill in your details and generate a clean, professional resume PDF instantly.</p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 20 }}>
          {/* Personal */}
          <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><label style={labelStyle}>Full Name *</label><input value={name} onChange={e => setName(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Email</label><input value={email} onChange={e => setEmail(e.target.value)} type="email" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Location</label><input value={location} onChange={e => setLocation(e.target.value)} style={fieldStyle} /></div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Summary</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>

          {/* Experience */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experience</h3>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={addExp}><Plus size={12} /> Add</button>
          </div>
          {experience.map((exp, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <div><label style={labelStyle}>Company</label><input value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Role</label><input value={exp.role} onChange={e => updateExp(i, 'role', e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Period</label><input value={exp.period} onChange={e => updateExp(i, 'period', e.target.value)} placeholder="2020-2023" style={fieldStyle} /></div>
              <button onClick={() => removeExp(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px' }}><Trash2 size={14} /></button>
            </div>
          ))}

          {/* Education */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 20 }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Education</h3>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={addEdu}><Plus size={12} /> Add</button>
          </div>
          {education.map((edu, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <div><label style={labelStyle}>School</label><input value={edu.school} onChange={e => updateEdu(i, 'school', e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Degree</label><input value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Year</label><input value={edu.year} onChange={e => updateEdu(i, 'year', e.target.value)} style={fieldStyle} /></div>
              <button onClick={() => removeEdu(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px' }}><Trash2 size={14} /></button>
            </div>
          ))}

          {/* Skills */}
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label style={labelStyle}>Skills (comma-separated)</label>
            <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js..." style={fieldStyle} />
          </div>

          <button className="btn btn-primary" onClick={generate} disabled={isGenerating} style={{ width: '100%' }}>
            {isGenerating ? <><Loader2 className="spinner" /> Generating...</> : <><Download size={18} /> Generate Resume PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}
