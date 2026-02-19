import { getToolMetadata } from '../lib/seo';

export const metadata = getToolMetadata('word-to-pdf');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
