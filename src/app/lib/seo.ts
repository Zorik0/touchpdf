import type { Metadata } from 'next';

const DOMAIN = 'https://touchpdf.space';

type ToolSEO = {
    title: string;
    description: string;
    keywords: string[];
    path: string;
};

const TOOL_SEO: Record<string, ToolSEO> = {
    'merge-pdf': {
        title: 'Merge PDF — Combine PDF Files Online Free',
        description: 'Merge multiple PDF files into one document instantly. Free, secure, no upload needed. Runs entirely in your browser.',
        keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'pdf merger online', 'free pdf combiner'],
        path: '/merge-pdf',
    },
    'split-pdf': {
        title: 'Split PDF — Extract Pages from PDF Online Free',
        description: 'Split PDF files by extracting specific pages or ranges. 100% client-side, no server uploads. Fast and free.',
        keywords: ['split pdf', 'extract pdf pages', 'pdf splitter', 'separate pdf pages', 'free pdf split'],
        path: '/split-pdf',
    },
    'invert': {
        title: 'Invert PDF Colors — Dark Mode for PDFs',
        description: 'Invert PDF colors for dark-mode reading or printing. Bulk process multiple files and download as ZIP.',
        keywords: ['invert pdf', 'pdf dark mode', 'reverse pdf colors', 'pdf color inverter', 'night mode pdf'],
        path: '/invert',
    },
    'pdf-to-png': {
        title: 'PDF to JPG — Convert PDF Pages to Images Free',
        description: 'Convert PDF pages to high-quality PNG/JPG images. Download individually or as a ZIP archive. No uploads.',
        keywords: ['pdf to jpg', 'pdf to png', 'pdf to image', 'convert pdf to picture', 'free pdf image converter'],
        path: '/pdf-to-png',
    },
    'png-to-pdf': {
        title: 'JPG to PDF — Convert Images to PDF Online Free',
        description: 'Combine JPG, PNG, or WebP images into a single PDF. Reorder before converting. Free and private.',
        keywords: ['jpg to pdf', 'png to pdf', 'image to pdf', 'photo to pdf', 'convert images to pdf free'],
        path: '/png-to-pdf',
    },
    'organize': {
        title: 'Organize PDF — Reorder & Delete PDF Pages',
        description: 'Drag and drop to reorder PDF pages. Delete unwanted pages and save the result. Client-side processing.',
        keywords: ['organize pdf', 'reorder pdf pages', 'delete pdf page', 'rearrange pdf', 'pdf page manager'],
        path: '/organize',
    },
    'extract-text': {
        title: 'PDF to Text — Extract Text from PDF Online Free',
        description: 'Extract raw text content from any PDF document. Copy to clipboard instantly. No file uploads.',
        keywords: ['pdf to text', 'extract text from pdf', 'copy pdf text', 'pdf text extractor', 'free pdf text'],
        path: '/extract-text',
    },
    'md-to-pdf': {
        title: 'Markdown to PDF — Convert MD to PDF with Custom CSS',
        description: 'Convert Markdown to beautifully formatted PDFs. Live preview, custom CSS styling, and template options.',
        keywords: ['markdown to pdf', 'md to pdf', 'convert markdown pdf', 'readme to pdf', 'markdown converter'],
        path: '/md-to-pdf',
    },
    'compress-pdf': {
        title: 'Compress PDF — Reduce PDF File Size Free',
        description: 'Reduce PDF file size while maintaining quality. Fast, client-side compression. Coming soon.',
        keywords: ['compress pdf', 'reduce pdf size', 'pdf compressor', 'shrink pdf', 'optimize pdf'],
        path: '/compress-pdf',
    },
    'word-to-pdf': {
        title: 'Word to PDF — Convert DOCX to PDF Online Free',
        description: 'Convert Microsoft Word documents to PDF format. Secure browser-based conversion. Beta.',
        keywords: ['word to pdf', 'docx to pdf', 'convert word to pdf', 'doc to pdf free'],
        path: '/word-to-pdf',
    },
    'excel-to-pdf': {
        title: 'Excel to PDF — Convert Spreadsheets to PDF',
        description: 'Convert Excel spreadsheets to PDF format. Coming soon.',
        keywords: ['excel to pdf', 'xlsx to pdf', 'spreadsheet to pdf'],
        path: '/excel-to-pdf',
    },
    'ppt-to-pdf': {
        title: 'PowerPoint to PDF — Convert Slides to PDF',
        description: 'Convert PowerPoint presentations to PDF format. Coming soon.',
        keywords: ['ppt to pdf', 'powerpoint to pdf', 'slides to pdf'],
        path: '/ppt-to-pdf',
    },
    'pdf-to-word': {
        title: 'PDF to Word — Convert PDF to DOCX Online Free',
        description: 'Convert PDF documents to editable Word format. Coming soon.',
        keywords: ['pdf to word', 'pdf to docx', 'convert pdf to word'],
        path: '/pdf-to-word',
    },
    'rotate-pdf': {
        title: 'Rotate PDF — Rotate PDF Pages Online Free',
        description: 'Rotate PDF pages by 90, 180, or 270 degrees. Apply to all or specific pages. Free client-side tool.',
        keywords: ['rotate pdf', 'turn pdf pages', 'pdf rotation', 'flip pdf', 'rotate pdf online free'],
        path: '/rotate-pdf',
    },
    'watermark-pdf': {
        title: 'Add Watermark to PDF — Stamp Text on PDF Free',
        description: 'Add custom text watermarks to every page of your PDF. Adjustable font size and opacity. 100% private.',
        keywords: ['watermark pdf', 'stamp pdf', 'add text to pdf', 'pdf watermark online', 'confidential stamp'],
        path: '/watermark-pdf',
    },
    'protect-pdf': {
        title: 'Password Protect PDF — Secure PDF with Password Free',
        description: 'Add password protection to your PDF documents. Secure files before sharing. Client-side processing.',
        keywords: ['protect pdf', 'password pdf', 'encrypt pdf', 'lock pdf', 'secure pdf online'],
        path: '/protect-pdf',
    },
    'print-assistor': {
        title: 'Print Assistor — Passport & ID Photo Print Prep Free',
        description: 'Prepare passport, visa, ID card, and custom-size photos for printing. Auto-tiles copies onto a sheet and generates a print-ready PDF. 100% client-side.',
        keywords: ['passport photo print', 'print passport size photo', 'visa photo online', 'id card photo', 'photo print tool', 'passport photo maker free'],
        path: '/print-assistor',
    },
    'privacy': {
        title: 'Privacy Policy',
        description: 'TouchPDF Privacy Policy. Learn how we handle your data — spoiler: we don\'t.',
        keywords: ['privacy policy', 'touchpdf privacy'],
        path: '/privacy',
    },
    'terms': {
        title: 'Terms of Use',
        description: 'TouchPDF Terms of Use. Read our terms and conditions.',
        keywords: ['terms of use', 'touchpdf terms'],
        path: '/terms',
    },
};

export function getToolMetadata(slug: string): Metadata {
    const tool = TOOL_SEO[slug];
    if (!tool) return {};

    return {
        title: tool.title,
        description: tool.description,
        keywords: tool.keywords,
        alternates: {
            canonical: `${DOMAIN}${tool.path}`,
        },
        openGraph: {
            title: tool.title,
            description: tool.description,
            url: `${DOMAIN}${tool.path}`,
            siteName: 'TouchPDF',
            type: 'website',
        },
        twitter: {
            card: 'summary',
            title: tool.title,
            description: tool.description,
        },
    };
}
