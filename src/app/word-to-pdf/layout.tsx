import { getToolMetadata, getToolJsonLd } from '../lib/seo';

export const metadata = getToolMetadata('word-to-pdf');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getToolJsonLd("word-to-pdf")) }}
      />
      {children}</>;
}
