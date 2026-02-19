import { getToolMetadata } from '../lib/seo';
export const metadata = getToolMetadata('privacy');
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
