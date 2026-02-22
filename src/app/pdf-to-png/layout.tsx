import { getToolMetadata, getToolJsonLd } from '../lib/seo';

export const metadata = getToolMetadata('pdf-to-png');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getToolJsonLd("pdf-to-png")) }}
      />
      {children}</>;
}
