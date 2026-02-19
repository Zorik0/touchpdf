'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Grid, Settings } from 'lucide-react';
import styles from './MobileBottomNav.module.css';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/organize', label: 'Files', icon: Layers },
    // { href: '/tools', label: 'Tools', icon: Grid }, // Assuming a Tools page or just menu
    { href: '/privacy', label: 'Menu', icon: Settings },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link 
            key={href} 
            href={href} 
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className={styles.navLabel}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
