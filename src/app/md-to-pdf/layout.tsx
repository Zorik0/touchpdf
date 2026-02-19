import { getToolMetadata } from '../lib/seo';

export const metadata = getToolMetadata('md-to-pdf');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
