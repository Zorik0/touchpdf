import type { MetadataRoute } from 'next';

const BASE_URL = 'https://touchpdf.space';

const PAGES = [
    { path: '/', priority: 1.0, freq: 'daily' as const },
    { path: '/merge-pdf', priority: 0.9, freq: 'weekly' as const },
    { path: '/split-pdf', priority: 0.9, freq: 'weekly' as const },
    { path: '/compress-pdf', priority: 0.9, freq: 'weekly' as const },
    { path: '/rotate-pdf', priority: 0.8, freq: 'weekly' as const },
    { path: '/watermark-pdf', priority: 0.8, freq: 'weekly' as const },
    { path: '/protect-pdf', priority: 0.8, freq: 'weekly' as const },
    { path: '/invert', priority: 0.8, freq: 'weekly' as const },
    { path: '/pdf-to-png', priority: 0.8, freq: 'weekly' as const },
    { path: '/png-to-pdf', priority: 0.8, freq: 'weekly' as const },
    { path: '/print-assistor', priority: 0.8, freq: 'weekly' as const },
    { path: '/organize', priority: 0.8, freq: 'weekly' as const },
    { path: '/extract-text', priority: 0.8, freq: 'weekly' as const },
    { path: '/sign-pdf', priority: 0.9, freq: 'weekly' as const },
    { path: '/page-numbers', priority: 0.8, freq: 'weekly' as const },
    { path: '/metadata-editor', priority: 0.7, freq: 'weekly' as const },
    { path: '/grayscale', priority: 0.7, freq: 'weekly' as const },
    { path: '/reverse-pdf', priority: 0.7, freq: 'weekly' as const },
    { path: '/blank-pages', priority: 0.7, freq: 'weekly' as const },
    { path: '/crop-pdf', priority: 0.8, freq: 'weekly' as const },
    { path: '/compress-image', priority: 0.8, freq: 'weekly' as const },
    { path: '/qr-code', priority: 0.8, freq: 'weekly' as const },
    { path: '/compare-pdf', priority: 0.7, freq: 'weekly' as const },
    { path: '/resume-builder', priority: 0.8, freq: 'weekly' as const },
    { path: '/invoice-generator', priority: 0.8, freq: 'weekly' as const },
    { path: '/certificate-generator', priority: 0.7, freq: 'weekly' as const },
    { path: '/md-to-pdf', priority: 0.7, freq: 'weekly' as const },
    { path: '/word-to-pdf', priority: 0.7, freq: 'weekly' as const },
    { path: '/excel-to-pdf', priority: 0.7, freq: 'weekly' as const },
    { path: '/ppt-to-pdf', priority: 0.7, freq: 'weekly' as const },
    { path: '/pdf-to-word', priority: 0.8, freq: 'weekly' as const },
    { path: '/pdf-to-excel', priority: 0.8, freq: 'weekly' as const },
    { path: '/annotate', priority: 0.8, freq: 'weekly' as const },
    { path: '/redact', priority: 0.8, freq: 'weekly' as const },
    { path: '/batch-convert', priority: 0.7, freq: 'weekly' as const },
    { path: '/unlock-pdf', priority: 0.8, freq: 'weekly' as const },
    { path: '/privacy-clean', priority: 0.7, freq: 'weekly' as const },
    { path: '/view-pdf', priority: 0.7, freq: 'weekly' as const },
    { path: '/privacy', priority: 0.3, freq: 'monthly' as const },
    { path: '/terms', priority: 0.3, freq: 'monthly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
    return PAGES.map(p => ({
        url: `${BASE_URL}${p.path}`,
        lastModified: new Date(),
        changeFrequency: p.freq,
        priority: p.priority,
    }));
}
