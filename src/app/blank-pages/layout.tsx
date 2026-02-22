import { getToolMetadata } from '../lib/seo';
export const metadata = getToolMetadata('blank-pages');
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
