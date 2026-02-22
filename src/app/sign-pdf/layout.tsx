import { getToolMetadata, getToolJsonLd } from '../lib/seo';
export const metadata = getToolMetadata('sign-pdf');
export default function Layout({ children }: { children: React.ReactNode }) { return <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getToolJsonLd("sign-pdf")) }}
      />
      {children}</>; }
