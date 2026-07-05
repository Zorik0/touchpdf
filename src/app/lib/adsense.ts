// Single source of truth for the AdSense publisher ID. Used by the ad
// loader script (layout.tsx), every <AdSlot />, and the /ads.txt route.
// Override by setting NEXT_PUBLIC_ADSENSE_CLIENT at build time (e.g. for a
// staging build that shouldn't serve real ads).
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-8520243761490725';
