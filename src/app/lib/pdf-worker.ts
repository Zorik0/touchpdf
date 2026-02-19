let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

export async function initPdfWorker() {
    if (typeof window === 'undefined') {
        throw new Error('Browser-only module executed during SSR');
    }

    if (!pdfjsPromise) {
        pdfjsPromise = (async () => {
            // Import pdfjs-dist directly — avoid react-pdf's re-export which
            // causes "Object.defineProperty called on non-object" with pdfjs-dist v5 + webpack
            const pdfjs = await import('pdfjs-dist');

            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                // Use the local worker file copied to public/
                pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
            }

            return pdfjs;
        })();
    }

    return pdfjsPromise;
}
