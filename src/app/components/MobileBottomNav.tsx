'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Combine,
  Scissors,
  Layers,
  Grid,
  X,
  Minimize2,
  RotateCw,
  ImageIcon,
  FileText,
  Droplets,
  Lock,
  Eraser,
  ArrowRightLeft,
  FileCode,
  Image as LucideImage,
} from 'lucide-react';
import styles from './MobileBottomNav.module.css';

const allTools = [
  { href: '/merge-pdf', label: 'Merge', icon: Combine },
  { href: '/split-pdf', label: 'Split', icon: Scissors },
  { href: '/compress-pdf', label: 'Compress', icon: Minimize2 },
  { href: '/organize', label: 'Organize', icon: Layers },
  { href: '/rotate-pdf', label: 'Rotate', icon: RotateCw },
  { href: '/pdf-to-png', label: 'PDF → Image', icon: LucideImage },
  { href: '/png-to-pdf', label: 'Image → PDF', icon: LucideImage },
  { href: '/word-to-pdf', label: 'Word → PDF', icon: FileText },
  { href: '/watermark-pdf', label: 'Watermark', icon: Droplets },
  { href: '/protect-pdf', label: 'Protect', icon: Lock },
  { href: '/redact', label: 'Redact', icon: Eraser },
  { href: '/invert', label: 'Invert', icon: ArrowRightLeft },
  { href: '/md-to-pdf', label: 'MD → PDF', icon: FileCode },
];

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
            <div className={styles.menuGrid}>
              {allTools.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon size={22} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
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
