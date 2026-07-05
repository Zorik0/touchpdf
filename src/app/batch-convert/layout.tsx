import { getToolMetadata, getToolJsonLd } from '../lib/seo';

export const metadata = getToolMetadata('batch-convert');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getToolJsonLd("batch-convert")) }}
      />
      {children}</>;
}
