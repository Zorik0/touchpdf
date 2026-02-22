import { getToolMetadata } from '../lib/seo';
export const metadata = getToolMetadata('metadata-editor');
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
