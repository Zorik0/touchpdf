import { getToolMetadata } from '../lib/seo';
export const metadata = getToolMetadata('protect-pdf');
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
