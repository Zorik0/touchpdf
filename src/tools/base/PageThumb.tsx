"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PageSize } from "./usePdfDocument";

type PageThumbProps = {
  pdf: PDFDocumentProxy;
  index: number;
  size: PageSize;
  /** Width the page is drawn at, in CSS pixels. */
  width: number;
  /** Extra clockwise rotation to preview, in degrees. */
  rotation?: number;
  className?: string;
  children?: ReactNode;
};

/**
 * One page drawn as a sheet of paper. It renders only once scrolled near the
 * viewport, so documents with hundreds of pages stay quick.
 */
export function PageThumb({ pdf, index, size, width, rotation = 0, className = "", children }: PageThumbProps) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [image, setImage] = useState<string>();

  const sideways = rotation % 180 !== 0;
  const aspect = sideways ? size.width / size.height : size.height / size.width;

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let url: string | undefined;

    (async () => {
      const page = await pdf.getPage(index + 1);
      const scale = (width / page.getViewport({ scale: 1 }).width) * Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport, background: "#ffffff" }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setImage(url);
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [visible, pdf, index, width]);

  return (
    <div
      ref={holder}
      className={`page-thumb ${className}`}
      style={{ width, height: Math.round(width * aspect) }}
    >
      {image && (
        // A local blob URL, so next/image can't optimize it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          draggable={false}
          style={{
            // Sized as the unrotated page, then turned about the center to fill the frame.
            width: sideways ? Math.round(width * aspect) : width,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
