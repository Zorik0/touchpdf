'use client';

import { useRef, useEffect, useState } from 'react';

interface Rect {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface RedactionCanvasProps {
    width: number;
    height: number;
    rects: Rect[];
    onRectsChange: (rects: Rect[]) => void;
}

export default function RedactionCanvas({ width, height, rects, onRectsChange }: RedactionCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<Rect | null>(null);

    // Draw function
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        // Draw existing rects
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Black redaction style
        ctx.strokeStyle = '#ef4444'; // Selection border
        
        rects.forEach(r => {
            ctx.fillRect(r.x, r.y, r.w, r.h);
            // Delete button or hover effect could be added here
        });

        // Draw current drawing rect
        if (currentRect) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
        }
    };

    useEffect(() => {
        draw();
    }, [rects, currentRect, width, height]);

    const getPos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        // The canvas may be displayed smaller than its internal size
        // (maxWidth: 100%), so convert CSS pixels to canvas coordinates.
        const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const pos = getPos(e);
        setStartPos(pos);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        
        const w = pos.x - startPos.x;
        const h = pos.y - startPos.y;

        setCurrentRect({
            id: 'temp',
            x: w < 0 ? pos.x : startPos.x,
            y: h < 0 ? pos.y : startPos.y,
            w: Math.abs(w),
            h: Math.abs(h)
        });
    };

    const handleMouseUp = () => {
        if (isDrawing && currentRect) {
            // Only add if size is significant
            if (currentRect.w > 5 && currentRect.h > 5) {
                onRectsChange([...rects, { ...currentRect, id: Math.random().toString(36).substr(2, 9) }]);
            }
        }
        setIsDrawing(false);
        setCurrentRect(null);
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                cursor: 'crosshair',
                touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                handleMouseDown(mouseEvent as any);
            }}
            onTouchMove={(e) => {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                handleMouseMove(mouseEvent as any);
            }}
            onTouchEnd={handleMouseUp}
        />
    );
}
