import { getToolMetadata, getToolJsonLd } from '../lib/seo';

export const metadata = getToolMetadata('view-pdf');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getToolJsonLd('view-pdf')) }}
    />
    {children}
  </>;
}
