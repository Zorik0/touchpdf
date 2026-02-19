import { getToolMetadata } from '../lib/seo';

export const metadata = getToolMetadata('invert');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
