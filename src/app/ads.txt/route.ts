// Serves /ads.txt for Google AdSense, generated from the publisher ID in
// NEXT_PUBLIC_ADSENSE_CLIENT (e.g. "ca-pub-1234567890123456").
// Returns 404 until the variable is configured, so an invalid ads.txt is
// never published.
export const dynamic = 'force-static';

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) {
    return new Response('Not configured', { status: 404 });
  }
  const pubId = client.replace(/^ca-/, ''); // ads.txt uses "pub-…" form
  return new Response(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
