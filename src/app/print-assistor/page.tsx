'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  Printer,
  Upload,
  X,
  Loader2,
  Download,
  Eye,
  Maximize2,
  Grid,
  Ruler,
  Settings2,
} from 'lucide-react';
import styles from './PrintAssistor.module.css';
import { useToast } from '../components/ui/Toast';

// ── Constants ──
type Unit = 'mm' | 'cm' | 'in' | 'px';

interface Preset {
  name: string;
  sub: string;
  widthMm: number;
  heightMm: number;
}

const PRESETS: Preset[] = [
  { name: 'Passport', sub: '35 × 45 mm', widthMm: 35, heightMm: 45 },
  { name: 'US Visa', sub: '51 × 51 mm', widthMm: 51, heightMm: 51 },
  { name: 'Aadhaar', sub: '25 × 31 mm', widthMm: 25, heightMm: 31 },
  { name: '2 × 2 in', sub: '51 × 51 mm', widthMm: 50.8, heightMm: 50.8 },
  { name: 'Wallet', sub: '64 × 89 mm', widthMm: 63.5, heightMm: 88.9 },
  { name: '1 × 1 in', sub: '25 × 25 mm', widthMm: 25.4, heightMm: 25.4 },
  { name: 'EU ID', sub: '35 × 45 mm', widthMm: 35, heightMm: 45 },
  { name: 'Stamp', sub: '20 × 25 mm', widthMm: 20, heightMm: 25 },
  { name: 'Custom', sub: 'Set your own', widthMm: 0, heightMm: 0 },
];

interface PaperSize {
  name: string;
  widthMm: number;
  heightMm: number;
}

const PAPER_SIZES: PaperSize[] = [
  { name: 'A4', widthMm: 210, heightMm: 297 },
  { name: 'Letter', widthMm: 215.9, heightMm: 279.4 },
  { name: 'A5', widthMm: 148, heightMm: 210 },
  { name: '4×6 in', widthMm: 101.6, heightMm: 152.4 },
];

const DPI_OPTIONS = [150, 300, 600];

// ── Conversion Helpers ──
const mmTo = (mm: number, unit: Unit, dpi: number): number => {
  switch (unit) {
    case 'mm': return mm;
    case 'cm': return mm / 10;
    case 'in': return mm / 25.4;
    case 'px': return (mm / 25.4) * dpi;
  }
};

const toMm = (val: number, unit: Unit, dpi: number): number => {
  switch (unit) {
    case 'mm': return val;
    case 'cm': return val * 10;
    case 'in': return val * 25.4;
    case 'px': return (val / dpi) * 25.4;
  }
};

interface UploadedImage {
  file: File;
  url: string;
  width: number;
  height: number;
}

export default function PrintAssistorPage() {
  // Image state
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [unit, setUnit] = useState<Unit>('mm');
  const [photoWidthMm, setPhotoWidthMm] = useState(35);
  const [photoHeightMm, setPhotoHeightMm] = useState(45);
  const [dpi, setDpi] = useState(300);
  const [paperIndex, setPaperIndex] = useState(0);
  const [spacingMm, setSpacingMm] = useState(3);
  const [marginMm, setMarginMm] = useState(10);

  // Generation
  const [isGenerating, setIsGenerating] = useState(false);

  const { addToast } = useToast();

  const paper = PAPER_SIZES[paperIndex];

  // ── Computed: how many photosfit ──
  const cols = Math.floor((paper.widthMm - marginMm * 2 + spacingMm) / (photoWidthMm + spacingMm)) || 0;
  const rows = Math.floor((paper.heightMm - marginMm * 2 + spacingMm) / (photoHeightMm + spacingMm)) || 0;
  const totalCopies = cols * rows;

  // ── Preview Canvas ──
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale: 1mm = 2px for preview
    const scale = 2;
    canvas.width = paper.widthMm * scale;
    canvas.height = paper.heightMm * scale;

    // Paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Margin guides
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      marginMm * scale,
      marginMm * scale,
      (paper.widthMm - marginMm * 2) * scale,
      (paper.heightMm - marginMm * 2) * scale
    );
    ctx.setLineDash([]);

    if (photoWidthMm <= 0 || photoHeightMm <= 0) return;

    // Draw photo slots
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (marginMm + c * (photoWidthMm + spacingMm)) * scale;
        const y = (marginMm + r * (photoHeightMm + spacingMm)) * scale;
        const w = photoWidthMm * scale;
        const h = photoHeightMm * scale;

        if (image) {
          // Draw image cropped to fill
          const imgEl = new Image();
          imgEl.src = image.url;
          // We need to use drawImage with object-fit: cover logic
          const imgAR = image.width / image.height;
          const slotAR = w / h;
          let sx = 0, sy = 0, sw = image.width, sh = image.height;
          if (imgAR > slotAR) {
            sw = image.height * slotAR;
            sx = (image.width - sw) / 2;
          } else {
            sh = image.width / slotAR;
            sy = (image.height - sh) / 2;
          }
          ctx.drawImage(imgEl, sx, sy, sw, sh, x, y, w, h);
        } else {
          // Empty slot
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = '#d0d0d0';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, w, h);
        }

        // Cut guide corners
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 0.5;
        const corner = 3 * scale;
        // top-left
        ctx.beginPath(); ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y); ctx.stroke();
        // top-right
        ctx.beginPath(); ctx.moveTo(x + w - corner, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + corner); ctx.stroke();
        // bottom-left
        ctx.beginPath(); ctx.moveTo(x, y + h - corner); ctx.lineTo(x, y + h); ctx.lineTo(x + corner, y + h); ctx.stroke();
        // bottom-right
        ctx.beginPath(); ctx.moveTo(x + w - corner, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - corner); ctx.stroke();
      }
    }
  }, [image, photoWidthMm, photoHeightMm, paper, spacingMm, marginMm, rows, cols]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // ── Image Upload ──
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    const imgEl = new Image();
    imgEl.onload = () => {
      setImage({ file, url, width: imgEl.width, height: imgEl.height });
    };
    imgEl.src = url;
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) handleFile(files[0]);
  };

  const removeImage = () => {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
  };

  // ── Preset Selection ──
  const selectPreset = (index: number) => {
    setSelectedPreset(index);
    const p = PRESETS[index];
    if (p.widthMm > 0 && p.heightMm > 0) {
      setPhotoWidthMm(p.widthMm);
      setPhotoHeightMm(p.heightMm);
    }
  };

  // ── Unit display values ──
  const displayW = parseFloat(mmTo(photoWidthMm, unit, dpi).toFixed(2));
  const displayH = parseFloat(mmTo(photoHeightMm, unit, dpi).toFixed(2));

  const handleWidthChange = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) {
      setPhotoWidthMm(toMm(n, unit, dpi));
      setSelectedPreset(PRESETS.length - 1); // custom
    }
  };

  const handleHeightChange = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) {
      setPhotoHeightMm(toMm(n, unit, dpi));
      setSelectedPreset(PRESETS.length - 1); // custom
    }
  };

  // ── Generate PDF ──
  const generatePdf = async () => {
    if (!image) {
      addToast('Upload a photo first', 'error');
      return;
    }
    if (totalCopies === 0) {
      addToast('Photo too large for this paper size', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const orientation = paper.widthMm > paper.heightMm ? 'l' : 'p';
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [paper.widthMm, paper.heightMm],
      });

      // Draw each photo tile
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = marginMm + c * (photoWidthMm + spacingMm);
          const y = marginMm + r * (photoHeightMm + spacingMm);

          // Draw the image — jsPDF accepts object URLs
          const format = image.file.type === 'image/png' ? 'PNG' : 'JPEG';
          try {
            pdf.addImage(image.url, format, x, y, photoWidthMm, photoHeightMm);
          } catch {
            // Fallback: convert to canvas data URL
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx2 = canvas.getContext('2d');
            if (ctx2) {
              const imgEl = new Image();
              imgEl.src = image.url;
              await new Promise(r => setTimeout(r, 50));
              ctx2.drawImage(imgEl, 0, 0);
              pdf.addImage(canvas.toDataURL(image.file.type), format, x, y, photoWidthMm, photoHeightMm);
            }
          }
        }
      }

      // Light cut guides
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.15);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = marginMm + c * (photoWidthMm + spacingMm);
          const y = marginMm + r * (photoHeightMm + spacingMm);
          const w = photoWidthMm;
          const h = photoHeightMm;
          const g = 2; // guide length mm
          // corners
          pdf.line(x, y, x + g, y); pdf.line(x, y, x, y + g);
          pdf.line(x + w, y, x + w - g, y); pdf.line(x + w, y, x + w, y + g);
          pdf.line(x, y + h, x + g, y + h); pdf.line(x, y + h, x, y + h - g);
          pdf.line(x + w, y + h, x + w - g, y + h); pdf.line(x + w, y + h, x + w, y + h - g);
        }
      }

      const presetName = PRESETS[selectedPreset].name.toLowerCase().replace(/\s+/g, '-');
      pdf.save(`print-${presetName}-${cols}x${rows}.pdf`);
      addToast(`PDF generated — ${totalCopies} copies on ${paper.name}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Error generating PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Drag & Drop ──
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="page-container">
      <div className={`${styles.wrapper} animate-in`}>
        <div className="section-header">
          <div className="section-badge">
            <Printer size={14} /> Print Assistor
          </div>
          <h1 className="section-title">
            Print-Ready <span className="gradient-text">Photo Prep</span>
          </h1>
          <p className="section-subtitle">
            Prepare passport, visa, ID, and custom-size photos for printing. Tiles copies onto a sheet and generates a print-ready PDF.
          </p>
        </div>

        {/* Upload Zone */}
        {!image ? (
          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="drop-zone-icon">
              <Upload size={48} strokeWidth={1} />
            </div>
            <div className="drop-zone-text">
              <strong>Drop your photo here</strong> (JPG, PNG, WebP)
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        ) : (
          <div className={styles.uploadedThumb}>
            <img src={image.url} alt="uploaded" className={styles.thumbImg} />
            <div className={styles.thumbInfo}>
              <div className={styles.thumbName}>{image.file.name}</div>
              <div className={styles.thumbMeta}>
                {image.width} × {image.height}px • {(image.file.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <button className={styles.thumbRemove} onClick={removeImage} title="Remove">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Settings Panel */}
        <div className={`${styles.settingsPanel} animate-in animate-delay-1`}>
          
          {/* Left: Photo Size */}
          <div className={styles.settingsGroup}>
            <div className={styles.groupTitle}>
              <Ruler size={14} /> Photo Size
            </div>

            {/* Presets */}
            <div className={styles.presetGrid}>
              {PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  className={`${styles.presetBtn} ${selectedPreset === i ? styles.presetBtnActive : ''}`}
                  onClick={() => selectPreset(i)}
                >
                  {p.name}
                  <span className={styles.presetSubtext}>{p.sub}</span>
                </button>
              ))}
            </div>

            {/* Unit toggle */}
            <div style={{ marginTop: 16 }}>
              <div className={styles.unitToggle}>
                {(['mm', 'cm', 'in', 'px'] as Unit[]).map(u => (
                  <button
                    key={u}
                    className={`${styles.unitBtn} ${unit === u ? styles.unitBtnActive : ''}`}
                    onClick={() => setUnit(u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Width × Height */}
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Width</label>
                <input
                  type="number"
                  className={styles.fieldInput}
                  value={displayW}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  step="0.1"
                  min="1"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Height</label>
                <input
                  type="number"
                  className={styles.fieldInput}
                  value={displayH}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  step="0.1"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Right: Print Settings */}
          <div className={styles.settingsGroup}>
            <div className={styles.groupTitle}>
              <Settings2 size={14} /> Print Settings
            </div>

            {/* Paper Size */}
            <div className={styles.field} style={{ marginBottom: 12 }}>
              <label className={styles.fieldLabel}>Paper Size</label>
              <select
                className={styles.fieldSelect}
                value={paperIndex}
                onChange={(e) => setPaperIndex(Number(e.target.value))}
              >
                {PAPER_SIZES.map((p, i) => (
                  <option key={p.name} value={i}>
                    {p.name} ({p.widthMm} × {p.heightMm} mm)
                  </option>
                ))}
              </select>
            </div>

            {/* DPI */}
            <div className={styles.field} style={{ marginBottom: 12 }}>
              <label className={styles.fieldLabel}>Print Quality (DPI)</label>
              <select
                className={styles.fieldSelect}
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
              >
                {DPI_OPTIONS.map(d => (
                  <option key={d} value={d}>
                    {d} DPI {d === 300 ? '— Recommended' : d === 600 ? '— High Quality' : '— Draft'}
                  </option>
                ))}
              </select>
            </div>

            {/* Spacing & Margin */}
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Spacing (mm)</label>
                <input
                  type="number"
                  className={styles.fieldInput}
                  value={spacingMm}
                  onChange={(e) => setSpacingMm(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="20"
                  step="1"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Margin (mm)</label>
                <input
                  type="number"
                  className={styles.fieldInput}
                  value={marginMm}
                  onChange={(e) => setMarginMm(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max="30"
                  step="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className={`${styles.previewSection} animate-in animate-delay-2`}>
          <div className={styles.previewHeader}>
            <div className={styles.previewTitle}>
              <Eye size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Print Preview
            </div>
            <div className={styles.previewInfo}>
              {paper.name} • {cols}×{rows} grid
            </div>
          </div>

          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} className={styles.previewCanvas} />
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statChip}>
              <Grid size={12} /> {totalCopies} copies
            </div>
            <div className={styles.statChip}>
              <Maximize2 size={12} /> {displayW} × {displayH} {unit}
            </div>
            <div className={styles.statChip}>
              <Printer size={12} /> {paper.name} paper
            </div>
            <div className={styles.statChip}>
              {dpi} DPI
            </div>
          </div>
        </div>

        {/* Generate */}
        <div className={`${styles.actions} animate-in animate-delay-3`}>
          <button
            className="btn btn-primary"
            onClick={generatePdf}
            disabled={!image || isGenerating || totalCopies === 0}
          >
            {isGenerating ? (
              <><Loader2 className="spinner" /> Generating...</>
            ) : (
              <><Download size={18} /> Download Print PDF</>
            )}
          </button>
          {image && (
            <button className="btn btn-ghost" onClick={() => { removeImage(); fileInputRef.current?.click(); }}>
              <Upload size={16} /> Change Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
