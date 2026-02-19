import { getToolMetadata } from '../lib/seo';

export const metadata = getToolMetadata('pdf-to-word');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
