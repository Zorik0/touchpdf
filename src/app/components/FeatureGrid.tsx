import type { LucideIcon } from 'lucide-react';
import ToolCard from './ToolCard';
import styles from '../Home.module.css';

interface Tool {
    href: string;
    type: string;
    icon: LucideIcon;
    title: string;
    desc: string;
    badge?: string;
    cat: string;
}

interface FeatureGridProps {
    tools: Tool[];
    categories: string[];
}

export default function FeatureGrid({ tools, categories }: FeatureGridProps) {
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = tools.filter(t => t.cat === cat);
    return acc;
  }, {} as Record<string, Tool[]>);

  return (
    <div className={styles.featureGridContainer}>
      <div className={styles.gridHeader}>
        <h2 className={styles.sectionTitle}>Everything You Can Do</h2>
        <p className={styles.sectionSubtitle}>Powerful PDF tools, running directly in your browser.</p>
      </div>

      <div className={styles.gridContent}>
        {categories.map((cat) => (
          <div key={cat} className={styles.categoryGroup}>
            <div className={styles.categoryHeader}>
                <h3 className={styles.categoryTitle}>{cat}</h3>
            </div>
            <div className={styles.toolGrid}>
              {grouped[cat].map(t => <ToolCard key={t.href} tool={t} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
