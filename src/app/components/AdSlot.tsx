'use client';

import { useEffect } from 'react';
import { ADSENSE_CLIENT } from '../lib/adsense';

interface AdSlotProps {
  slot: string;        // Your Google Ads slot ID
  format?: string;     // e.g. 'auto', 'rectangle', 'horizontal'
  className?: string;
}

/**
 * Google AdSense unit. Publisher ID comes from lib/adsense.ts (overridable
 * via NEXT_PUBLIC_ADSENSE_CLIENT at build time). The loader script in
 * layout.tsx uses the same constant.
 */
export default function AdSlot({ slot, format = 'auto', className = '' }: AdSlotProps) {
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch { /* ad blocked or script not loaded */ }
  }, []);

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
