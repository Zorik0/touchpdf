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
    'view-pdf': {
        title: 'PDF Viewer — Read PDF Files Online Free',
        description: 'Open and read any PDF in your browser. No uploads, no accounts. Remembers your last page so you can pick up where you left off.',
        keywords: ['pdf viewer', 'read pdf online', 'open pdf browser', 'pdf reader free', 'view pdf file'],
        path: '/view-pdf',
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
    'page-numbers': {
        title: 'Add Page Numbers to PDF — Free Online Tool',
        description: 'Add sequential page numbers to every page of your PDF. Choose position, font size, and starting number. 100% client-side.',
        keywords: ['add page numbers pdf', 'pdf page numbers', 'number pdf pages', 'page numbering tool'],
        path: '/page-numbers',
    },
    'metadata-editor': {
        title: 'PDF Metadata Editor — View & Edit PDF Properties Free',
        description: 'View and edit title, author, subject, and keywords of any PDF. Free, private, browser-based.',
        keywords: ['pdf metadata editor', 'edit pdf properties', 'pdf title author', 'pdf info editor'],
        path: '/metadata-editor',
    },
    'grayscale': {
        title: 'Grayscale PDF — Convert Color PDF to Black & White',
        description: 'Convert color PDFs to grayscale for printing or reducing file size. Fast, client-side processing.',
        keywords: ['grayscale pdf', 'pdf to black and white', 'convert pdf bw', 'pdf grayscale converter'],
        path: '/grayscale',
    },
    'reverse-pdf': {
        title: 'Reverse PDF Pages — Flip Page Order Online Free',
        description: 'Reverse the order of all pages in your PDF. Useful for duplex printing. No uploads needed.',
        keywords: ['reverse pdf', 'flip pdf pages', 'reverse page order', 'pdf page reverser'],
        path: '/reverse-pdf',
    },
    'blank-pages': {
        title: 'Add Blank Pages to PDF — Insert Empty Pages Free',
        description: 'Insert blank pages at the start, end, after each page, or at specific positions in your PDF.',
        keywords: ['add blank pages pdf', 'insert empty page pdf', 'pdf blank page inserter'],
        path: '/blank-pages',
    },
    'crop-pdf': {
        title: 'Crop PDF — Trim PDF Page Margins Online Free',
        description: 'Crop and trim margins from all PDF pages. Remove whitespace and adjust page boundaries.',
        keywords: ['crop pdf', 'trim pdf margins', 'pdf crop tool', 'remove pdf whitespace'],
        path: '/crop-pdf',
    },
    'sign-pdf': {
        title: 'Sign PDF Online — Draw or Type Signature Free',
        description: 'Sign PDF documents by drawing or typing your signature. Place it on any page. 100% private, no uploads.',
        keywords: ['sign pdf', 'pdf signature', 'esign pdf', 'draw signature pdf', 'pdf signer online free'],
        path: '/sign-pdf',
    },
    'compress-image': {
        title: 'Compress Images — Reduce JPG PNG WebP File Size Free',
        description: 'Compress images with adjustable quality. Supports JPG, PNG, WebP. See exact size savings. Client-side.',
        keywords: ['compress image', 'image compressor', 'reduce image size', 'jpg compressor', 'png optimizer'],
        path: '/compress-image',
    },
    'qr-code': {
        title: 'QR Code Generator — Create QR Codes Free',
        description: 'Generate QR codes for URLs, text, or any data. Customizable colors and sizes. Download as PNG.',
        keywords: ['qr code generator', 'create qr code', 'qr code maker', 'free qr generator'],
        path: '/qr-code',
    },
    'compare-pdf': {
        title: 'Compare PDFs — Side-by-Side PDF Comparison Free',
        description: 'Compare two PDF documents side by side, page by page. Spot differences visually. No uploads.',
        keywords: ['compare pdf', 'pdf diff', 'pdf comparison', 'side by side pdf'],
        path: '/compare-pdf',
    },
    'resume-builder': {
        title: 'Resume Builder — Create Professional Resume PDF Free',
        description: 'Build a professional resume PDF instantly. Fill in your details, add experience and education, download as PDF.',
        keywords: ['resume builder', 'cv maker', 'resume to pdf', 'free resume generator', 'create resume online'],
        path: '/resume-builder',
    },
    'invoice-generator': {
        title: 'Invoice Generator — Create Invoices PDF Free',
        description: 'Generate professional invoices with line items, tax, and totals. Download as PDF. Free and private.',
        keywords: ['invoice generator', 'create invoice pdf', 'free invoice maker', 'bill generator'],
        path: '/invoice-generator',
    },
    'certificate-generator': {
        title: 'Certificate Generator — Create Certificates PDF Free',
        description: 'Generate beautiful certificates for achievements, completions, or participation. Multiple templates.',
        keywords: ['certificate generator', 'create certificate pdf', 'award certificate maker', 'free certificate'],
        path: '/certificate-generator',
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

/**
 * Generate JSON-LD structured data for a specific tool.
 * Embeds as a SoftwareApplication with BreadcrumbList for Google rich results.
 */
export function getToolJsonLd(slug: string) {
    const tool = TOOL_SEO[slug];
    if (!tool) return null;

    return [
        {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: tool.title.split('—')[0]?.trim() || tool.title,
            url: `${DOMAIN}${tool.path}`,
            description: tool.description,
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'All',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
            },
            isAccessibleForFree: true,
            browserRequirements: 'Requires a modern browser with JavaScript enabled',
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'TouchPDF',
                    item: DOMAIN,
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: tool.title.split('—')[0]?.trim() || tool.title,
                    item: `${DOMAIN}${tool.path}`,
                },
            ],
        },
    ];
}
