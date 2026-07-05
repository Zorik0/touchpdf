# TouchPDF

Privacy-first PDF toolbox — 35+ tools that run **entirely in the browser**.
No uploads, no accounts, no server-side processing: merging, splitting,
converting, signing, redacting, annotating, and more, all done client-side
with `pdf-lib`, `pdf.js`, `jsPDF`, and `JSZip`.

Live at [touchpdf.space](https://touchpdf.space).

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

## Google AdSense

Ads are disabled until a publisher ID is configured. To enable them, set the
environment variable at **build time**:

```bash
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-1234567890123456
```

(on Vercel: Project → Settings → Environment Variables, then redeploy)

This one variable drives everything:

- the AdSense loader script in `src/app/layout.tsx`
- every `<AdSlot />` ad unit (they render nothing while unset, so the site
  shows no empty ad boxes during review)
- `/ads.txt`, generated automatically in the correct
  `google.com, pub-…, DIRECT, f08c47fec0942fa0` format

Ad slot IDs are passed per-placement via the `slot` prop of
`src/app/components/AdSlot.tsx`.

## Project layout

- `src/app/<tool>/page.tsx` — one route per tool (all client components)
- `src/app/<tool>/layout.tsx` — per-tool SEO metadata + JSON-LD (`src/app/lib/seo.ts`)
- `src/app/lib/pdf-worker.ts` — shared pdf.js loader (worker served from `public/`)
- `src/app/lib/ooxml.ts` — minimal .docx/.xlsx/.pptx build & parse helpers
- `src/app/lib/pdf-text.ts` — positioned text extraction for PDF→Word/Excel
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/manifest.ts` — SEO/PWA

## Notes

- `public/pdf.worker.min.mjs` must match the installed `pdfjs-dist` version
  (copy from `node_modules/pdfjs-dist/build/` after upgrading).
- PWA support is provided by `@ducanh2912/next-pwa`; `public/sw.js` is
  generated during `npm run build`.
