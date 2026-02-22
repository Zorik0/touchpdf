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
  Plus,
  Minus,
  ImagePlus,
  Hash,
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
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
}

export default function PrintAssistorPage() {
  // Multi-image state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);

  // Settings
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [unit, setUnit] = useState<Unit>('mm');
  const [photoWidthMm, setPhotoWidthMm] = useState(35);
  const [photoHeightMm, setPhotoHeightMm] = useState(45);
  const [dpi, setDpi] = useState(300);
  const [paperIndex, setPaperIndex] = useState(0);
  const [spacingMm, setSpacingMm] = useState(3);
  const [marginMm, setMarginMm] = useState(10);

  // Quantity control
  const [copyCount, setCopyCount] = useState<number>(0); // 0 = auto (fill sheet)
  const [autoFill, setAutoFill] = useState(true);

  // Generation
  const [isGenerating, setIsGenerating] = useState(false);

  const { addToast } = useToast();

  const paper = PAPER_SIZES[paperIndex];

  // ── Computed: max photos that fit ──
  const cols = Math.floor((paper.widthMm - marginMm * 2 + spacingMm) / (photoWidthMm + spacingMm)) || 0;
  const rows = Math.floor((paper.heightMm - marginMm * 2 + spacingMm) / (photoHeightMm + spacingMm)) || 0;
  const maxCopies = cols * rows;

  // Actual copies to print
  const actualCopies = autoFill ? maxCopies : Math.min(copyCount, maxCopies);

  // ── Preview Canvas ──
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Build the slot-to-image mapping: cycle through images for each slot
  const getImageForSlot = useCallback((slotIndex: number): UploadedImage | null => {
    if (images.length === 0) return null;
    return images[slotIndex % images.length];
  }, [images]);

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
    let slotIndex = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (slotIndex >= actualCopies) break;

        const x = (marginMm + c * (photoWidthMm + spacingMm)) * scale;
        const y = (marginMm + r * (photoHeightMm + spacingMm)) * scale;
        const w = photoWidthMm * scale;
        const h = photoHeightMm * scale;

        const slotImage = getImageForSlot(slotIndex);

        if (slotImage) {
          // Draw image cropped to fill
          const imgEl = new Image();
          imgEl.src = slotImage.url;
          const imgAR = slotImage.width / slotImage.height;
          const slotAR = w / h;
          let sx = 0, sy = 0, sw = slotImage.width, sh = slotImage.height;
          if (imgAR > slotAR) {
            sw = slotImage.height * slotAR;
            sx = (slotImage.width - sw) / 2;
          } else {
            sh = slotImage.width / slotAR;
            sy = (slotImage.height - sh) / 2;
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
        ctx.beginPath(); ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - corner, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + corner); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + h - corner); ctx.lineTo(x, y + h); ctx.lineTo(x + corner, y + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - corner, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - corner); ctx.stroke();

        slotIndex++;
      }
      if (slotIndex >= actualCopies) break;
    }
  }, [images, photoWidthMm, photoHeightMm, paper, spacingMm, marginMm, rows, cols, actualCopies, getImageForSlot]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // ── Image Upload ──
  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newItems: Promise<UploadedImage>[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(file => {
        return new Promise<UploadedImage>((resolve) => {
          const url = URL.createObjectURL(file);
          const imgEl = new Image();
          imgEl.onload = () => {
            resolve({
              id: Math.random().toString(36).substring(7),
              file,
              url,
              width: imgEl.width,
              height: imgEl.height,
            });
          };
          imgEl.src = url;
        });
      });

    Promise.all(newItems).then(loaded => {
      setImages(prev => [...prev, ...loaded]);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter(i => i.id !== id);
    });
  };

  const removeAllImages = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
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
      setSelectedPreset(PRESETS.length - 1);
    }
  };

  const handleHeightChange = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) {
      setPhotoHeightMm(toMm(n, unit, dpi));
      setSelectedPreset(PRESETS.length - 1);
    }
  };

  // ── Quantity Helpers ──
  const incrementCopies = () => {
    if (autoFill) {
      setAutoFill(false);
      setCopyCount(Math.min(maxCopies, maxCopies));
    } else {
      setCopyCount(prev => Math.min(prev + 1, maxCopies));
    }
  };

  const decrementCopies = () => {
    if (autoFill) {
      setAutoFill(false);
      setCopyCount(Math.max(1, maxCopies - 1));
    } else {
      setCopyCount(prev => Math.max(1, prev - 1));
    }
  };

  const toggleAutoFill = () => {
    if (!autoFill) {
      setAutoFill(true);
      setCopyCount(0);
    } else {
      setAutoFill(false);
      setCopyCount(maxCopies);
    }
  };

  // ── Generate PDF ──
  const generatePdf = async () => {
    if (images.length === 0) {
      addToast('Upload at least one photo first', 'error');
      return;
    }
    if (actualCopies === 0) {
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
      let slotIndex = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (slotIndex >= actualCopies) break;

          const x = marginMm + c * (photoWidthMm + spacingMm);
          const y = marginMm + r * (photoHeightMm + spacingMm);

          const slotImage = getImageForSlot(slotIndex);
          if (slotImage) {
            const format = slotImage.file.type === 'image/png' ? 'PNG' : 'JPEG';
            try {
              pdf.addImage(slotImage.url, format, x, y, photoWidthMm, photoHeightMm);
            } catch {
              // Fallback: convert to canvas data URL
              const canvas = document.createElement('canvas');
              canvas.width = slotImage.width;
              canvas.height = slotImage.height;
              const ctx2 = canvas.getContext('2d');
              if (ctx2) {
                const imgEl = new Image();
                imgEl.src = slotImage.url;
                await new Promise(r => setTimeout(r, 50));
                ctx2.drawImage(imgEl, 0, 0);
                pdf.addImage(canvas.toDataURL(slotImage.file.type), format, x, y, photoWidthMm, photoHeightMm);
              }
            }
          }
          slotIndex++;
        }
        if (slotIndex >= actualCopies) break;
      }

      // Light cut guides
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.15);
      slotIndex = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (slotIndex >= actualCopies) break;
          const x = marginMm + c * (photoWidthMm + spacingMm);
          const y = marginMm + r * (photoHeightMm + spacingMm);
          const w = photoWidthMm;
          const h = photoHeightMm;
          const g = 2;
          pdf.line(x, y, x + g, y); pdf.line(x, y, x, y + g);
          pdf.line(x + w, y, x + w - g, y); pdf.line(x + w, y, x + w, y + g);
          pdf.line(x, y + h, x + g, y + h); pdf.line(x, y + h, x, y + h - g);
          pdf.line(x + w, y + h, x + w - g, y + h); pdf.line(x + w, y + h, x + w, y + h - g);
          slotIndex++;
        }
        if (slotIndex >= actualCopies) break;
      }

      const presetName = PRESETS[selectedPreset].name.toLowerCase().replace(/\s+/g, '-');
      pdf.save(`print-${presetName}-${actualCopies}copies.pdf`);
      addToast(`PDF generated — ${actualCopies} copies on ${paper.name}`, 'success');
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
    if (e.dataTransfer.files?.length) addImages(e.dataTransfer.files);
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
            Prepare passport, visa, ID, and custom-size photos for printing. Upload one or multiple photos, control quantities, and generate a print-ready PDF.
          </p>
        </div>

        {/* Upload Zone */}
        {images.length === 0 ? (
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
              <strong>Drop your photo(s) here</strong> (JPG, PNG, WebP)
              <br />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Upload one photo to repeat it, or multiple for a mix
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => addImages(e.target.files)}
            />
          </div>
        ) : (
          <div className={styles.imageListSection}>
            <div className={styles.imageListHeader}>
              <span className={styles.imageListTitle}>
                <ImagePlus size={14} /> {images.length} photo{images.length !== 1 ? 's' : ''} uploaded
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  onClick={() => addMoreRef.current?.click()}
                >
                  <Plus size={14} /> Add More
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 14px', fontSize: '0.78rem', color: 'var(--danger)' }}
                  onClick={removeAllImages}
                >
                  <X size={14} /> Clear All
                </button>
              </div>
              <input
                ref={addMoreRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => { addImages(e.target.files); e.target.value = ''; }}
              />
            </div>
            <div className={styles.imageChips}>
              {images.map((img) => (
                <div key={img.id} className={styles.imageChip}>
                  <img src={img.url} alt="thumb" className={styles.chipThumb} />
                  <span className={styles.chipName}>{img.file.name}</span>
                  <button
                    className={styles.chipRemove}
                    onClick={() => removeImage(img.id)}
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <div className={styles.multiImageHint}>
                Photos will cycle across slots: slot 1 gets photo 1, slot 2 gets photo 2, etc.
              </div>
            )}
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

            {/* Quantity Control */}
            <div className={styles.field} style={{ marginBottom: 12 }}>
              <label className={styles.fieldLabel}>
                <Hash size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Number of Copies
              </label>
              <div className={styles.quantityRow}>
                <button
                  className={styles.qtyBtn}
                  onClick={decrementCopies}
                  disabled={!autoFill && copyCount <= 1}
                >
                  <Minus size={14} />
                </button>
                <div className={styles.qtyDisplay}>
                  {autoFill ? maxCopies : copyCount}
                </div>
                <button
                  className={styles.qtyBtn}
                  onClick={incrementCopies}
                  disabled={!autoFill && copyCount >= maxCopies}
                >
                  <Plus size={14} />
                </button>
                <button
                  className={`${styles.autoFillBtn} ${autoFill ? styles.autoFillActive : ''}`}
                  onClick={toggleAutoFill}
                  title={autoFill ? 'Auto-fill is ON — using max copies' : 'Click to auto-fill sheet'}
                >
                  {autoFill ? 'Auto ✓' : 'Auto'}
                </button>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {autoFill
                  ? `Auto-fill: ${maxCopies} copies fit on ${paper.name}`
                  : `${copyCount} of ${maxCopies} max slots used`
                }
              </div>
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
              {paper.name} • {actualCopies} of {maxCopies} slots
            </div>
          </div>

          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} className={styles.previewCanvas} />
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statChip}>
              <Grid size={12} /> {actualCopies} copies
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
            {images.length > 1 && (
              <div className={styles.statChip}>
                <ImagePlus size={12} /> {images.length} photos
              </div>
            )}
          </div>
        </div>

        {/* Generate */}
        <div className={`${styles.actions} animate-in animate-delay-3`}>
          <button
            className="btn btn-primary"
            onClick={generatePdf}
            disabled={images.length === 0 || isGenerating || actualCopies === 0}
          >
            {isGenerating ? (
              <><Loader2 className="spinner" /> Generating...</>
            ) : (
              <><Download size={18} /> Download Print PDF</>
            )}
          </button>
          {images.length > 0 && (
            <button className="btn btn-ghost" onClick={() => { removeAllImages(); fileInputRef.current?.click(); }}>
              <Upload size={16} /> Start Over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
