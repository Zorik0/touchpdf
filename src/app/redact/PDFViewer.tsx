'use client';

import { useState, useRef, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { initPdfWorker } from '../lib/pdf-worker';
import styles from './Redact.module.css';
import RedactionCanvas from './RedactionCanvas';

interface RedactionRect {
    id: string;
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface PDFViewerProps {
    file: File;
    rects: RedactionRect[];
    pageNumber: number;
    scale: number;
    onLoadSuccess: (data: { numPages: number }) => void;
    onPageLoadSuccess: (page: { width: number; height: number }) => void;
    onRectsChange: (rects: Omit<RedactionRect, 'page'>[]) => void;
}

export default function PDFViewer({ 
    file, 
    rects, 
    pageNumber, 
    scale, 
    onLoadSuccess, 
    onPageLoadSuccess, 
    onRectsChange 
}: PDFViewerProps) {
    const [pageWidth, setPageWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // State (not a ref) so the render effect re-runs once the document loads.
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

    // Get rects for current page (strip page property for canvas)
    const currentPageRects = rects.filter(r => r.page === pageNumber).map(({ page, ...rest }) => rest);

    // Load the PDF document
    useEffect(() => {
        let cancelled = false;

        const loadPdf = async () => {
            try {
                setLoading(true);
                const arrayBuffer = await file.arrayBuffer();
                const pdfjs = await initPdfWorker();
                const pdf = await pdfjs.getDocument(arrayBuffer).promise;

                if (cancelled) return;

                setPdfDoc(pdf);
                onLoadSuccess({ numPages: pdf.numPages });
            } catch (err) {
                console.error('Error loading PDF:', err);
            }
        };

        loadPdf();
        return () => { cancelled = true; };
    }, [file]);

    // Render the current page
    useEffect(() => {
        const pdf = pdfDoc;
        if (!pdf || !canvasRef.current) return;

        let cancelled = false;

        const renderPage = async () => {
            try {
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas || cancelled) return;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvasContext: ctx, viewport }).promise;

                if (cancelled) return;

                setPageWidth(viewport.width);
                setPageHeight(viewport.height);
                onPageLoadSuccess({ width: viewport.width, height: viewport.height });
                setLoading(false);
            } catch (err) {
                console.error('Error rendering page:', err);
            }
        };

        renderPage();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfDoc, pageNumber, scale]);

    return (
        <div className={styles.pdfDocument}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <canvas
                    ref={canvasRef}
                    className={styles.pdfPage}
                    style={{ display: 'block', maxWidth: '100%' }}
                />

                {pageWidth > 0 && !loading && (
                    <RedactionCanvas 
                        width={pageWidth} 
                        height={pageHeight} 
                        rects={currentPageRects} 
                        onRectsChange={onRectsChange}
                    />
                )}
            </div>
        </div>
    );
}
