import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from '../Home.module.css';

interface Tool {
  href: string;
  type: string;
  icon: any;
  title: string;
  desc: string;
  badge?: string;
  cat?: string;
}

export default function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  
  return (
    <Link href={tool.href} className={styles.toolCard} data-type={tool.type}>
      <div className={styles.toolHeader}>
        <div className={styles.toolIconWrapper}>
            <Icon size={24} strokeWidth={1.5} />
        </div>
        {tool.badge && <span className={styles.newBadge}>{tool.badge}</span>}
      </div>
      
      <div className={styles.toolInfo}>
        <h3 className={styles.toolTitle}>{tool.title}</h3>
        <p className={styles.toolDesc}>{tool.desc}</p>
      </div>

      <div className={styles.toolAction}>
        <span>Use Now</span>
        <ArrowRight size={14} />
      </div>
    </Link>
  );
}
