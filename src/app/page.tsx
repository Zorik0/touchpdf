'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './Home.module.css';
import Logo from './components/Logo';
import AdSlot from './components/AdSlot';
import ToolCard from './components/ToolCard';
import FeatureGrid from './components/FeatureGrid';
import TrustBar from './components/TrustBar';
import { ALL_TOOLS, CATEGORIES, catId } from './lib/tools';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return ALL_TOOLS.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.keywords.includes(q)
    );
  }, [query]);

  return (
    <div className="page-container">
      <section className={styles.hero}>

        {/* Compact header */}
        <div className={`${styles.heroTop} animate-in`}>
          <Logo size={44} />
          <h1 className={styles.heroTitle}>
            Every PDF tool you need. <span className="gradient-text">100% in your browser.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            No uploads, no sign-ups, no watermarks — files never leave your device.
          </p>
        </div>

        {/* Search */}
        <div id="search" className={`${styles.searchWrapper} animate-in animate-delay-1`}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={searchRef}
            type="text"
            className={styles.searchInput}
            placeholder={`Search ${ALL_TOOLS.length} tools… e.g. merge, sign, compress`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.searchClear} onClick={() => { setQuery(''); searchRef.current?.focus(); }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category quick-nav (hidden while searching) */}
        {filtered === null && (
          <nav className={`${styles.catNav} animate-in animate-delay-2`} aria-label="Tool categories">
            {CATEGORIES.map(cat => (
              <a key={cat} href={`#${catId(cat)}`} className={styles.catChip}>
                {cat}
                <span className={styles.catCount}>{ALL_TOOLS.filter(t => t.cat === cat).length}</span>
              </a>
            ))}
          </nav>
        )}

        {/* Content */}
        <div className="animate-in animate-delay-2">
          {filtered !== null ? (
            <div className={styles.featureGridContainer}>
              <div className={styles.searchResultHeader}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              </div>
              {filtered.length > 0 ? (
                <div className={styles.toolGrid}>
                  {filtered.map(t => <ToolCard key={t.href} tool={t} />)}
                </div>
              ) : (
                <div className={styles.emptySearch}>
                  No tools found. Try &ldquo;merge&rdquo;, &ldquo;compress&rdquo;, or &ldquo;convert&rdquo;.
                </div>
              )}
            </div>
          ) : (
            <FeatureGrid tools={ALL_TOOLS} categories={CATEGORIES} />
          )}
        </div>

        {/* Trust line — after the tools, before footer */}
        <div className="animate-in animate-delay-3">
          <TrustBar />
        </div>

        <AdSlot slot="3456789012" format="horizontal" className={styles.adBanner} />
      </section>
    </div>
  );
}
