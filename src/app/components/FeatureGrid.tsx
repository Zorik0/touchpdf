import ToolCard from './ToolCard';
import styles from '../Home.module.css';
import { catId, type Tool } from '../lib/tools';

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
      {categories.map((cat) => (
        <section key={cat} id={catId(cat)} className={styles.categoryGroup}>
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>{cat}</h2>
            <span className={styles.categoryCount}>{grouped[cat].length} tools</span>
          </div>
          <div className={styles.toolGrid}>
            {grouped[cat].map(t => <ToolCard key={t.href} tool={t} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
