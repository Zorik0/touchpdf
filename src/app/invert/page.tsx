'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument, PDFName, PDFArray, PDFRawStream, PDFRef } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  ArrowRightLeft, 
  Upload, 
  File, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download, 
  Trash2,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { initPdfWorker } from '../lib/pdf-worker';
import styles from './Invert.module.css';

type FileStatus = 'pending' | 'processing' | 'done' | 'error';

interface FileItem {
  id: string;
  file: File;
  status: FileStatus;
  invertedBytes: Uint8Array | null;
  invertedUrl: string | null;
  totalPages: number;
}

export default function InvertPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  
  // For previews, we track the currently selected item to show
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const invertedCanvasRef = useRef<HTMLCanvasElement>(null);

  const selectedItem = items.find(i => i.id === selectedItemId) || items[0] || null;

  // Render a page from a PDF (blob URL) onto a canvas
  const renderPage = useCallback(async (url: string, canvas: HTMLCanvasElement, pageNum: number) => {
    try {
      const pdfjs = await initPdfWorker();
      const loadingTask = pdfjs.getDocument(url);
      const pdf = await loadingTask.promise;
      
      // Handle out of bounds
      if (pageNum >= pdf.numPages) pageNum = 0;
      
      const page = await pdf.getPage(pageNum + 1);
      const scale = 1.0; 
      // Adjust scale based on canvas container width if needed, but 1.0 or 1.5 is standard
      const viewport = page.getViewport({ scale: 1.5 });

      // Check if canvas is still valid in DOM
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear previous render
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };
        await page.render(renderContext as any).promise;
      }
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }, []);

  // Effect to render previews when selected item changes
  useEffect(() => {
    if (!selectedItem) return;

    // Create URL for original file if not exists (we don't store it to save memory, create on fly?)
    // Actually better to create it once. Let's assume we create it when needed.
    const originalUrl = URL.createObjectURL(selectedItem.file);
    
    if (originalCanvasRef.current) {
      renderPage(originalUrl, originalCanvasRef.current, previewPage);
    }
    
    if (selectedItem.invertedUrl && invertedCanvasRef.current) {
      renderPage(selectedItem.invertedUrl, invertedCanvasRef.current, previewPage);
    }

    // Cleanup
    return () => {
      URL.revokeObjectURL(originalUrl);
    };
  }, [selectedItem, previewPage, renderPage, selectedItem?.invertedUrl]);


  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newItems: FileItem[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type !== 'application/pdf') continue;
      
      const id = Math.random().toString(36).substring(7);
      let totalPages = 0;

      // Try to get page count immediately
      try {
        const ab = await file.arrayBuffer();
        const pdfjs = await initPdfWorker();
        const loadingTask = pdfjs.getDocument(ab);
        const pdf = await loadingTask.promise;
        totalPages = pdf.numPages;
      } catch (e) { console.error(e); }

      newItems.push({
        id,
        file,
        status: 'pending',
        invertedBytes: null,
        invertedUrl: null,
        totalPages
      });
    }

    setItems(prev => [...prev, ...newItems]);
    if (!selectedItemId && newItems.length > 0) {
      setSelectedItemId(newItems[0].id);
    }
  }, [selectedItemId]);

  const processItem = async (item: FileItem): Promise<FileItem> => {
     try {
      const arrayBuffer = await item.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      
      // Update item with page count if we missed it
      item.totalPages = pages.length;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Use raw MediaBox/CropBox instead of getSize() which adjusts for rotation.
        // The content stream operates in the raw coordinate space.
        const mediaBox = page.node.get(PDFName.of('MediaBox'));
        const cropBox = page.node.get(PDFName.of('CropBox'));
        let boxArr: number[] = [0, 0, 612, 792]; // fallback A4

        const resolveBox = (box: any): number[] | null => {
          if (!box) return null;
          let resolved = box;
          if (resolved instanceof PDFRef) {
            resolved = pdfDoc.context.lookup(resolved);
          }
          if (resolved instanceof PDFArray) {
            return [
              (resolved.get(0) as any)?.numberValue ?? (resolved.get(0) as any)?.value ?? 0,
              (resolved.get(1) as any)?.numberValue ?? (resolved.get(1) as any)?.value ?? 0,
              (resolved.get(2) as any)?.numberValue ?? (resolved.get(2) as any)?.value ?? 612,
              (resolved.get(3) as any)?.numberValue ?? (resolved.get(3) as any)?.value ?? 792,
            ];
          }
          return null;
        };

        const resolvedCrop = resolveBox(cropBox);
        const resolvedMedia = resolveBox(mediaBox);
        if (resolvedCrop) boxArr = resolvedCrop;
        else if (resolvedMedia) boxArr = resolvedMedia;

        const bx = boxArr[0];
        const by = boxArr[1];
        const bw = boxArr[2] - boxArr[0];
        const bh = boxArr[3] - boxArr[1];

        // 1. Create ExtGState with 'Difference' blend mode
        const extGState = pdfDoc.context.obj({
          Type: PDFName.of('ExtGState'),
          BM: PDFName.of('Difference'),
        });
        const extGStateRef = pdfDoc.context.register(extGState);

        // 2. Add to Resources
        let resources = page.node.get(PDFName.of('Resources'));
        if (!resources) {
          resources = pdfDoc.context.obj({});
          page.node.set(PDFName.of('Resources'), resources);
        }
        
        let resourcesObj = resources;
        if (resources instanceof PDFRef) {
          resourcesObj = pdfDoc.context.lookup(resources) as typeof resources;
        }

        const gsName = 'GS_Invert';
        let extGStateDict = (resourcesObj as any).get(PDFName.of('ExtGState'));
        if (!extGStateDict) {
          extGStateDict = pdfDoc.context.obj({});
          (resourcesObj as any).set(PDFName.of('ExtGState'), extGStateDict);
        }

        if (extGStateDict instanceof PDFRef) {
          extGStateDict = pdfDoc.context.lookup(extGStateDict);
        }
        (extGStateDict as any).set(PDFName.of(gsName), extGStateRef);

        // 3. Inject inversion rect covering the full page box
        const invertOps = `\nq\n/${gsName} gs\n1 1 1 rg\n${bx} ${by} ${bw} ${bh} re\nf\nQ\n`;
        const contentStreamRef = page.node.get(PDFName.of('Contents'));
        const invertStream = pdfDoc.context.flateStream(invertOps);
        const invertStreamRef = pdfDoc.context.register(invertStream);

        if (!contentStreamRef) {
           page.node.set(PDFName.of('Contents'), invertStreamRef);
        } else if (contentStreamRef instanceof PDFArray) {
           contentStreamRef.push(invertStreamRef);
        } else if (contentStreamRef instanceof PDFRef) {
           const newArr = pdfDoc.context.obj([contentStreamRef, invertStreamRef]);
           page.node.set(PDFName.of('Contents'), newArr);
        }
      }

      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      return {
        ...item,
        status: 'done',
        invertedBytes: modifiedBytes,
        invertedUrl: url
      };

    } catch (err) {
      console.error('Processing error', err);
      return { ...item, status: 'error' };
    }
  };

  const processAll = async () => {
    setIsProcessing(true);
    
    // Process strictly sequentially to avoid browser hanging
    const newItems = [...items];
    
    for (let i = 0; i < newItems.length; i++) {
        if (newItems[i].status === 'done') continue;
        
        newItems[i] = { ...newItems[i], status: 'processing' };
        setItems([...newItems]);
        
        const processed = await processItem(newItems[i]);
        newItems[i] = processed;
        setItems([...newItems]); // Update UI after each file
    }
    
    setIsProcessing(false);
  };

  const downloadSingle = (item: FileItem) => {
    if (!item.invertedUrl || !item.invertedBytes) return;
    const a = document.createElement('a');
    a.href = item.invertedUrl;
    a.download = `inverted_${item.file.name}`;
    a.click();
  };

  const downloadAllZip = async () => {
    const zip = new JSZip();
    let count = 0;
    
    items.forEach(item => {
      if (item.invertedBytes) {
        zip.file(`inverted_${item.file.name}`, item.invertedBytes);
        count++;
      }
    });

    if (count === 0) return;

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inverted_pdfs.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    // Revoke URLs to avoid memory leaks
    items.forEach(item => {
      if (item.invertedUrl) URL.revokeObjectURL(item.invertedUrl);
    });
    setItems([]);
    setSelectedItemId(null);
  };
  
  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (item?.invertedUrl) URL.revokeObjectURL(item.invertedUrl);
    
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    if (selectedItemId === id) {
      setSelectedItemId(newItems[0]?.id || null);
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="page-container">

      <div className={`${styles.wrapper} animate-in`}>
        <div className="section-header">
          <div className="section-badge">
             <RefreshCw size={14} /> Batch Processing
          </div>
          <h1 className="section-title">
            Bulk <span className="gradient-text">PDF Inverter</span>
          </h1>
          <p className="section-subtitle">
            Upload multiple PDFs, invert their colors instantly, and download as a ZIP.
          </p>
        </div>

        {/* Upload Area */}
        <div 
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          style={{ marginBottom: 32 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="drop-zone-icon">
            <Upload size={48} strokeWidth={1} />
          </div>
          <div className="drop-zone-text">
            <strong>Drop multiple PDFs here</strong> or click to add
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
          />
        </div>

        {items.length > 0 && (
           <div className="animate-in animate-delay-1">
             <div className={`${styles.toolbar} animate-in`}>
               <div className={styles.fileInfo}>
                 <span className="status-pill info">{items.length} files selected</span>
               </div>
               
               <div className={styles.actions}>
                 <button 
                   className="btn btn-primary" 
                   onClick={processAll} 
                   disabled={isProcessing || items.every(i => i.status === 'done')}
                 >
                   {isProcessing ? <><Loader2 className="spinner" /> Processing...</> : <><RefreshCw size={18} /> Invert All</>}
                 </button>
                 
                 {items.some(i => i.status === 'done') && (
                   <button className="btn btn-primary" onClick={downloadAllZip}>
                     <Download size={18} /> Download ZIP
                   </button>
                 )}
                 
                 <button className="btn btn-ghost" onClick={clearAll} disabled={isProcessing}>
                   <Trash2 size={16} /> Clear All
                 </button>
               </div>
             </div>

             <div className={styles.splitView}>
               {/* List of files */}
               <div className={styles.fileList}>
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className={`${styles.fileItem} ${selectedItemId === item.id ? styles.selected : ''}`}
                      onClick={() => { setSelectedItemId(item.id); setPreviewPage(0); }}
                    >
                       <div className={styles.fileIcon}>
                         {item.status === 'done' ? <CheckCircle2 size={18} color="var(--success)" /> : 
                          item.status === 'error' ? <XCircle size={18} color="var(--danger)" /> : 
                          item.status === 'processing' ? <Loader2 size={18} className="spinner" /> : 
                          <File size={18} />}
                       </div>
                       <div className={styles.fileDetails}>
                         <div className={styles.fileName}>{item.file.name}</div>
                         <div className={styles.fileMeta}>
                           {formatSize(item.file.size)} • {item.status}
                         </div>
                       </div>
                       {item.status === 'done' ? (
                          <button 
                            className={styles.iconBtn} 
                            onClick={(e) => { e.stopPropagation(); downloadSingle(item); }}
                            title="Download this file"
                          >
                            <Download size={16} />
                          </button>
                       ) : (
                          <button 
                            className={styles.iconBtn}
                            onClick={(e) => removeItem(item.id, e)}
                            title="Remove"
                          >
                            <XCircle size={16} />
                          </button>
                       )}
                    </div>
                  ))}
               </div>

               {/* Preview Panel */}
               <div className={styles.previewContainer}>
                 {selectedItem && (
                   <>
                     <div className={styles.previewHeader}>
                        <span style={{display:'flex', alignItems:'center', gap:8}}>
                          <Eye size={16} /> Preview: {selectedItem.file.name}
                        </span>
                        {selectedItem.status === 'done' && (
                           <span className="status-pill success">Inverted</span>
                        )}
                     </div>
                     
                     <div className={styles.previewCanvasArea}>
                       {selectedItem.invertedUrl ? (
                          <canvas ref={invertedCanvasRef} style={{ maxWidth:'100%', borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }} />
                       ) : (
                          <canvas ref={originalCanvasRef} style={{ maxWidth:'100%', borderRadius:8, opacity: 0.7 }} />
                       )}
                     </div>
                     
                     {selectedItem.totalPages > 1 && (
                      <div className={styles.pageSelector} style={{marginTop:16}}>
                        <button className={styles.pageBtn} onClick={() => setPreviewPage(p => Math.max(0, p-1))} disabled={previewPage===0}>
                          <ChevronLeft size={20} />
                        </button>
                        <span className={styles.pageInfo}>Page {previewPage+1} / {selectedItem.totalPages}</span>
                        <button className={styles.pageBtn} onClick={() => setPreviewPage(p => Math.min(selectedItem.totalPages-1, p+1))} disabled={previewPage >= selectedItem.totalPages-1}>
                          <ChevronRight size={20} />
                        </button>
                      </div>
                     )}
                   </>
                 )}
               </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
