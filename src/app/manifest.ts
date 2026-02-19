import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'TouchPDF — Free Client-Side PDF Tools',
        short_name: 'TouchPDF',
        description: 'Merge, split, convert, and edit PDFs securely in your browser. No uploads, 100% private.',
        id: '/',
        start_url: '/',
        display: 'standalone',
        background_color: '#08080c',
        theme_color: '#e8734a',
        orientation: 'any',
        scope: '/',
        categories: ['productivity', 'utilities'],
        icons: [
            {
                src: '/icon-192',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icon-512', // Using 512 for maskable too for now, ideally dedicated maskable
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            }
        ],
    };
}
