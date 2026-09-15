# TouchPDF

Free PDF tools that run entirely in your browser. Files are read and processed on your device and never uploaded.

Live at [touchpdf.space](https://touchpdf.space).

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

## How it's built

- `src/tools/registry.ts` lists every tool as data. The home page, tool pages, sitemap and metadata all read from it.
- `src/app` holds the routes: the home page, legal pages, robots, sitemap and manifest.
- `public/sw.js` retires the service worker that TouchPDF v1 installed, so returning visitors get the new site.

`backend/` contains the LibreOffice and Ghostscript conversion service used by v1. The current version doesn't call it.
