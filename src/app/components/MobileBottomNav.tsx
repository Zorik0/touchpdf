'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Combine, Scissors, Layers, Grid, X } from 'lucide-react';
import styles from './MobileBottomNav.module.css';
import { ALL_TOOLS, CATEGORIES } from '../lib/tools';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const quickLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/merge-pdf', label: 'Merge', icon: Combine },
    { href: '/split-pdf', label: 'Split', icon: Scissors },
    { href: '/organize', label: 'Organize', icon: Layers },
  ];

  return (
    <>
      {/* Full-screen tools menu */}
      {menuOpen && (
        <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)}>
          <div className={styles.menuPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.menuHeader}>
              <h3>All Tools</h3>
              <button className={styles.closeBtn} onClick={() => setMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {CATEGORIES.map(cat => (
              <div key={cat}>
                <div className={styles.menuCategory}>{cat}</div>
                <div className={styles.menuGrid}>
                  {ALL_TOOLS.filter(t => t.cat === cat).map(({ href, title, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon size={20} />
                        <span>{title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className={styles.bottomNav}>
        {quickLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          );
        })}
        <button
          className={`${styles.navItem} ${menuOpen ? styles.active : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Grid size={22} strokeWidth={1.8} />
          <span className={styles.navLabel}>Tools</span>
        </button>
      </nav>
    </>
  );
}
