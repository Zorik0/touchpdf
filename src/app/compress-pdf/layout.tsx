import { getToolMetadata } from '../lib/seo';

export const metadata = getToolMetadata('compress-pdf');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
