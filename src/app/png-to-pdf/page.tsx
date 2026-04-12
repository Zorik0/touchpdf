'use client';

import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { 
  FileStack, 
  Upload, 
  File, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Loader2, 
  FilePlus, 
  MoveUp, 
  MoveDown
} from 'lucide-react';
import styles from './PngToPdf.module.css';
import { useToast } from '../components/ui/Toast';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export default function PngToPdfPage() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Revoke all preview URLs on unmount to avoid memory leaks.
  useEffect(() => {
    return () => {
      items.forEach(item => URL.revokeObjectURL(item.previewUrl));
    };
  }, [items]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newItems: Promise<ImageItem>[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(file => {
        return new Promise((resolve) => {
           const url = URL.createObjectURL(file);
           const img = new Image();
           img.onload = () => {
             resolve({
               id: Math.random().toString(36).substring(7),
               file,
               previewUrl: url,
               width: img.width,
               height: img.height
             });
           };
           img.src = url;
        });
      });

    Promise.all(newItems).then(loadedItems => {
      setItems(prev => [...prev, ...loadedItems]);
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newItems = [...items];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
  };

  const removeItem = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const generatePdf = async () => {
    if (items.length === 0) return;
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      
      for (let i = 0; i < items.length; i++) {
        if (i > 0) pdf.addPage();
        
        const item = items[i];
        
        // Calculate dimensions to fit within A4 margins (approx 10mm)
        const margin = 10;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);
        
        let w = item.width;
        let h = item.height;
        
        // Scale down if needed
        const scale = Math.min(availableWidth / w, availableHeight / h, 1);
        
        const finalW = w * scale;
        const finalH = h * scale;
        
        const x = (pageWidth - finalW) / 2;
        const y = (pageHeight - finalH) / 2;

        const format = item.file.type === 'image/png' ? 'PNG' : 'JPEG';
        
        try {
           pdf.addImage(item.previewUrl, format, x, y, finalW, finalH);
        } catch (e) {
           console.warn('Direct addImage failed, trying canvas fallback', e);
           // Fallback: draw to canvas
           const canvas = document.createElement('canvas');
           canvas.width = item.width;
           canvas.height = item.height;
           const ctx = canvas.getContext('2d');
           if (ctx) {
             const imgEl = new Image();
             imgEl.src = item.previewUrl;
             await new Promise(r => setTimeout(r, 0)); // tick
             ctx.drawImage(imgEl, 0, 0);
             pdf.addImage(canvas.toDataURL(item.file.type), format, x, y, finalW, finalH);
           }
        }
      }
      
      pdf.save('images-combined.pdf');
    } catch (err) {
      console.error(err);
      addToast('Error generating PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Drag & Drop
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
            <FileStack size={14} /> Image to PDF
          </div>
          <h1 className="section-title">
            PNG to <span className="gradient-text">PDF</span>
          </h1>
          <p className="section-subtitle">
            Combine multiple images into a single PDF document. Rearrange them as needed.
          </p>
        </div>

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
            <strong>Drop images here</strong> (PNG, JPG, WebP)
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {items.length > 0 && (
          <div className="animate-in animate-delay-1">
             <div className="section-header" style={{marginBottom: 10, marginTop: 40}}>
                <button 
                  className="btn btn-primary" 
                  onClick={generatePdf}
                  disabled={isGenerating}
                >
                  {isGenerating ? <><Loader2 className="spinner" /> Generating...</> : <><FilePlus size={18} /> Generate PDF</>}
                </button>
             </div>
             
             <div className={styles.imageList}>
               {items.map((item, index) => (
                 <div key={item.id} className={styles.imageItem}>
                   <div className={styles.thumb}>
                     <img src={item.previewUrl} alt="preview" />
                   </div>
                   <div className={styles.details}>
                     <div className={styles.name}>{item.file.name}</div>
                     <div className={styles.meta}>
                       {item.width} x {item.height} • {(item.file.size / 1024).toFixed(1)} KB
                     </div>
                   </div>
                   <div className={styles.controls}>
                     <button 
                       className={styles.controlBtn} 
                       onClick={() => moveItem(index, -1)}
                       disabled={index === 0}
                       title="Move Up"
                     >
                       <MoveUp size={16} />
                     </button>
                     <button 
                       className={styles.controlBtn} 
                       onClick={() => moveItem(index, 1)}
                       disabled={index === items.length - 1}
                       title="Move Down"
                     >
                       <MoveDown size={16} />
                     </button>
                     <button 
                       className={`${styles.controlBtn} ${styles.deleteBtn}`}
                       onClick={() => removeItem(item.id)}
                       title="Remove"
                     >
                       <X size={16} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
