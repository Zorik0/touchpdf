import { getToolMetadata } from '../lib/seo';

export const metadata = getToolMetadata('extract-text');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
