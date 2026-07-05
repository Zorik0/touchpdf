'use client';

import { useEffect } from 'react';

interface AdSlotProps {
  slot: string;        // Your Google Ads slot ID
  format?: string;     // e.g. 'auto', 'rectangle', 'horizontal'
  className?: string;
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/**
 * Google AdSense unit.
 * Configure by setting NEXT_PUBLIC_ADSENSE_CLIENT (e.g. "ca-pub-1234567890")
 * at build time. When unset, nothing is rendered — no empty ad boxes.
 * The AdSense loader script is added in layout.tsx from the same variable.
 */
export default function AdSlot({ slot, format = 'auto', className = '' }: AdSlotProps) {
  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch { /* ad blocked or script not loaded */ }
  }, []);

  if (!ADSENSE_CLIENT) return null;

  return (
    <div className={`ad-slot ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 90 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
