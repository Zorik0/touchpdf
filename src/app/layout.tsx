import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";
import { ToastProvider } from "./components/ui/Toast";
import { ToolBreadcrumb, RelatedTools } from "./components/ToolChrome";
import { ADSENSE_CLIENT } from "./lib/adsense";

const DOMAIN = 'https://touchpdf.space';

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: 'TouchPDF — Free Online PDF Tools | Merge, Split, Convert PDFs',
    template: '%s | TouchPDF',
  },
  description: 'Free, secure, client-side PDF tools. Merge, split, compress, sign, watermark, annotate, redact, convert PDFs to JPG/Word/Excel, add page numbers, crop, compare, generate invoices, resumes, certificates, QR codes — all in your browser. No uploads, 100% private.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TouchPDF',
  },
  keywords: [
    'pdf tools online free',
    'merge pdf', 'combine pdf files', 'join pdf',
    'split pdf', 'extract pdf pages',
    'compress pdf', 'reduce pdf size',
    'pdf to jpg', 'pdf to png', 'pdf to image',
    'jpg to pdf', 'image to pdf', 'png to pdf',
    'pdf to word', 'pdf to docx',
    'pdf to excel', 'pdf to xlsx',
    'word to pdf', 'docx to pdf',
    'ppt to pdf', 'powerpoint to pdf',
    'sign pdf online free', 'esign pdf', 'pdf signature',
    'add page numbers to pdf',
    'rotate pdf', 'rotate pdf pages',
    'watermark pdf', 'stamp pdf',
    'protect pdf', 'encrypt pdf', 'password protect pdf',
    'unlock pdf', 'remove pdf password',
    'crop pdf', 'trim pdf margins',
    'grayscale pdf', 'pdf to black and white',
    'reverse pdf pages', 'flip page order',
    'add blank pages pdf',
    'pdf metadata editor', 'edit pdf properties',
    'compare pdf', 'pdf diff', 'pdf comparison',
    'redact pdf', 'remove sensitive info pdf',
    'annotate pdf', 'highlight pdf',
    'organize pdf pages', 'reorder pdf',
    'compress image', 'image compressor', 'reduce image size',
    'qr code generator', 'create qr code free',
    'resume builder', 'cv maker', 'resume to pdf free',
    'invoice generator', 'create invoice pdf',
    'certificate generator', 'create certificate pdf',
    'markdown to pdf', 'md to pdf',
    'invert pdf colors', 'dark mode pdf',
    'batch convert pdf',
    'passport photo print', 'print assistor',
    'privacy cleaner pdf', 'pdf editor online',
    'client side pdf', 'secure pdf tools', 'no upload pdf tools',
    'touchpdf',
  ],
  authors: [{ name: 'Shaad' }],
  creator: 'Shaad',
  publisher: 'TouchPDF',
  formatDetection: {
    email: false,
    telephone: false,
  },
  alternates: {
    canonical: DOMAIN,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: DOMAIN,
    siteName: 'TouchPDF',
    title: 'TouchPDF — Free Online PDF Tools | Merge, Split, Sign, Convert PDFs',
    description: 'Merge, split, compress, sign, convert PDFs. Plus resume builder, invoice generator, QR codes, image compressor. No uploads, 100% free.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TouchPDF — Free PDF Tools',
    description: 'Private, instant PDF tools running in your browser.',
    creator: '@touchpdf',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Static icon files (in public/) — dynamic icon routes cost a function
  // invocation per favicon request on Vercel.
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: 'your-verification-code',
  },
  category: 'technology',
};

// JSON-LD structured data for the website
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TouchPDF',
  url: DOMAIN,
  description: 'Free, secure, client-side PDF tools. 35+ tools: merge, split, sign, compress, convert, watermark, and more.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Merge PDF files',
    'Split PDF pages',
    'Compress PDF',
    'Sign PDF with draw or type signature',
    'Add page numbers to PDF',
    'Rotate PDF pages',
    'Watermark PDF',
    'Protect PDF with password',
    'Unlock PDF',
    'Crop PDF margins',
    'Convert PDF to JPG/PNG',
    'Convert JPG to PDF',
    'Convert PDF to Word',
    'Convert PDF to Excel',
    'Convert Word to PDF',
    'Convert PowerPoint to PDF',
    'Grayscale PDF',
    'Reverse PDF page order',
    'Add blank pages to PDF',
    'Edit PDF metadata',
    'Compare two PDFs side by side',
    'Redact PDF',
    'Annotate PDF',
    'Organize and reorder PDF pages',
    'Invert PDF colors (dark mode)',
    'Markdown to PDF',
    'Batch convert PDFs',
    'Compress images (JPG, PNG, WebP)',
    'Generate QR codes',
    'Scan and duplicate QR codes',
    'Resume/CV builder to PDF',
    'Invoice generator to PDF',
    'Certificate generator to PDF',
    'Passport and ID photo print preparation',
    'Privacy cleaner - remove PDF metadata',
  ],
  browserRequirements: 'Requires a modern browser with JavaScript enabled',
  permissions: 'none',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '120',
    bestRating: '5',
  },
};

// FAQ structured data for Google rich snippets
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is TouchPDF free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, TouchPDF is completely free. All 35+ tools run directly in your browser with no hidden costs, subscriptions, or watermarks.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are my files uploaded to any server?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. TouchPDF processes everything client-side in your browser. Your files never leave your device, ensuring complete privacy and security.',
      },
    },
    {
      '@type': 'Question',
      name: 'What PDF tools does TouchPDF offer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TouchPDF offers 35+ free tools: Merge, Split, Compress, Sign, Add Page Numbers, Rotate, Watermark, Protect, Unlock, Crop, Grayscale, Reverse Pages, Add Blank Pages, Metadata Editor, Compare PDFs, Redact, Annotate, Organize Pages, Invert Colors, PDF to JPG, JPG to PDF, PDF to Word, PDF to Excel, Word to PDF, PPT to PDF, Markdown to PDF, Batch Convert, Compress Images, QR Code Generator, Resume Builder, Invoice Generator, Certificate Generator, Print Assistor, and Privacy Cleaner.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I sign a PDF online for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click "Sign PDF" on TouchPDF, draw or type your signature, upload your PDF, choose the page and position, then download the signed document. No account or upload to any server required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I add page numbers to a PDF?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Use the "Page Numbers" tool to add sequential numbers to every page. Choose the position (top/bottom, left/center/right), font size, starting number, and optional prefix like "Page ".',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I compress images for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use TouchPDF\'s Image Compressor. Upload JPG, PNG, or WebP images, adjust the quality slider, set a max width, and choose the output format. You\'ll see exactly how much space was saved.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I generate a resume or invoice as PDF?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! TouchPDF has a Resume Builder (fill in your details, experience, and education) and an Invoice Generator (add line items, tax, and totals) that generate professional PDFs instantly.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I create a QR code?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use the QR Code Generator. Enter any URL or text, customize foreground/background colors and size, then download as PNG. You can also scan an existing QR code to extract its data and regenerate it with new colors.',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        {/* Google AdSense — publisher ID from lib/adsense.ts */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ToastProvider>
          <main className="main-content">
            <ToolBreadcrumb />
            {children}
            <RelatedTools />
          </main>
          
          <footer className="site-footer">
            <p>
              made with <span style={{color: 'var(--danger)'}}>♥</span> for my wife, 
              but u mortals can use it aswell
            </p>
            <p style={{ marginTop: 8, fontSize: '0.75rem' }}>
              <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', marginRight: 16 }}>Privacy Policy</a>
              <a href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Use</a>
            </p>
          </footer>

          <Navbar />
          <MobileBottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
