import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'TouchPDF — Free Client-Side PDF Tools',
        short_name: 'TouchPDF',
        description: 'Merge, split, convert, and edit PDFs securely in your browser. No uploads, 100% private.',
        start_url: '/',
        display: 'standalone',
        background_color: '#08080c',
        theme_color: '#e8734a',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
