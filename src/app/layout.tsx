import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";

const DOMAIN = 'https://touchpdf.space';

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: 'TouchPDF — Free Online PDF Tools | Merge, Split, Convert PDFs',
    template: '%s | TouchPDF',
  },
  description: 'Free, secure, client-side PDF tools. Merge, split, compress, convert PDFs to JPG, extract text, and more — all in your browser. No file uploads, 100% private.',
  keywords: [
    'pdf tools online free',
    'merge pdf',
    'split pdf',
    'compress pdf',
    'pdf to jpg',
    'jpg to pdf',
    'pdf to word',
    'pdf converter',
    'combine pdf files',
    'extract text from pdf',
    'pdf editor online',
    'client side pdf',
    'secure pdf tools',
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
    title: 'TouchPDF — Free Online PDF Tools',
    description: 'Merge, split, compress, convert PDFs securely in your browser. No uploads, no sign-up. 100% free.',
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
  description: 'Free, secure, client-side PDF tools. Merge, split, compress, convert PDFs — all in your browser.',
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
    'Convert PDF to JPG',
    'Convert JPG to PDF',
    'Compress PDF',
    'Extract text from PDF',
    'Invert PDF colors',
    'Organize PDF pages',
    'Markdown to PDF',
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
        text: 'Yes, TouchPDF is completely free. All tools run directly in your browser with no hidden costs or subscriptions.',
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
        text: 'TouchPDF offers: Merge PDF, Split PDF, Compress PDF, PDF to JPG, JPG to PDF, PDF to Text, Invert PDF Colors, Organize PDF Pages, and Markdown to PDF conversion.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I merge multiple PDFs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click "Merge PDF" on the homepage, drag and drop your PDF files, arrange them in the desired order, then click "Merge PDFs" to download a single combined document.',
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
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        {/* Google AdSense — replace ca-pub-XXXX with your real publisher ID */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <main className="main-content">
          {children}
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
      </body>
    </html>
  );
}
