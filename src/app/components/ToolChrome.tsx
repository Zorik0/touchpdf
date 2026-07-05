'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { findTool, relatedTools } from '../lib/tools';
import styles from './ToolChrome.module.css';

/**
 * Shared chrome rendered on every tool page from the root layout:
 * a breadcrumb back to the tool index at the top, and a "more tools"
 * strip at the bottom. Renders nothing on non-tool routes.
 */
export function ToolBreadcrumb() {
  const pathname = usePathname();
  const tool = findTool(pathname);
  if (!tool) return null;

  return (
    <div className={styles.breadcrumb}>
      <Link href="/" className={styles.backLink}>
        <ArrowLeft size={14} />
        All tools
      </Link>
      <span className={styles.crumbSep}>/</span>
      <span className={styles.crumbCat}>{tool.cat}</span>
      <span className={styles.crumbSep}>/</span>
      <span className={styles.crumbCurrent}>{tool.title}</span>
    </div>
  );
}

export function RelatedTools() {
  const pathname = usePathname();
  const tool = findTool(pathname);
  if (!tool) return null;
  const related = relatedTools(pathname, 6);
  if (related.length === 0) return null;

  return (
    <div className={styles.related}>
      <div className={styles.relatedTitle}>More tools</div>
      <div className={styles.relatedGrid}>
        {related.map(t => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href} className={styles.relatedCard}>
              <Icon size={16} className={styles.relatedIcon} />
              <span>{t.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
