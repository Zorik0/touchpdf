// Serves /ads.txt for Google AdSense, generated from the shared publisher
// ID in lib/adsense.ts.
import { ADSENSE_CLIENT } from '../lib/adsense';

export const dynamic = 'force-static';

export function GET() {
  const pubId = ADSENSE_CLIENT.replace(/^ca-/, ''); // ads.txt uses "pub-…" form
  return new Response(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
