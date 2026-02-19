'use client';

interface AdSlotProps {
  slot: string;        // Your Google Ads slot ID
  format?: string;     // e.g. 'auto', 'rectangle', 'horizontal'
  className?: string;
}

/**
 * Google Ads placeholder.
 * Replace `data-ad-client` and `data-ad-slot` with your real values.
 * The ad script is loaded in layout.tsx.
 */
export default function AdSlot({ slot, format = 'auto', className = '' }: AdSlotProps) {
  return (
    <div className={`ad-slot ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 90 }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" /* ← Replace with your publisher ID */
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
