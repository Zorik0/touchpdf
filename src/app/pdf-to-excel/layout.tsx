import { getToolMetadata, getToolJsonLd } from '../lib/seo';

export const metadata = getToolMetadata('pdf-to-excel');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getToolJsonLd("pdf-to-excel")) }}
      />
      {children}</>;
}
