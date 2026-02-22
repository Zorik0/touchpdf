import { getToolMetadata, getToolJsonLd } from '../lib/seo';
export const metadata = getToolMetadata('page-numbers');
export default function Layout({ children }: { children: React.ReactNode }) { return <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getToolJsonLd("page-numbers")) }}
      />
      {children}</>; }
