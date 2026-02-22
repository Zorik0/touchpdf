import { getToolMetadata } from '../lib/seo';
export const metadata = getToolMetadata('page-numbers');
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
