import Link from 'next/link';
import styles from '../Home.module.css';
import type { Tool } from '../lib/tools';

export default function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <Link href={tool.href} className={styles.toolCard} data-type={tool.type}>
      <div className={styles.toolIconWrapper}>
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className={styles.toolInfo}>
        <h3 className={styles.toolTitle}>
          {tool.title}
          {tool.badge && <span className={styles.newBadge}>{tool.badge}</span>}
        </h3>
        <p className={styles.toolDesc}>{tool.desc}</p>
      </div>
    </Link>
  );
}
