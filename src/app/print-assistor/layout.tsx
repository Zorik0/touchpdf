import { getToolMetadata } from '../lib/seo';

export const metadata = getToolMetadata('print-assistor');

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
