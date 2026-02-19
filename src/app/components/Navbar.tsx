'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ArrowRightLeft, 
  FileText, 
  Image as ImageIcon, 
  FileStack, 
  Layers, 
  Type,
  Combine,
  Scissors,
  Minimize2,
  RotateCw,
  Droplets,
  Lock,
  Search
} from 'lucide-react';
import Logo from './Logo';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/merge-pdf', label: 'Merge', icon: Combine },
  { href: '/compress-pdf', label: 'Compress', icon: Minimize2 },
  { href: '/split-pdf', label: 'Split', icon: Scissors },
  { href: '/organize', label: 'Organize', icon: Layers },
  { href: '/word-to-pdf', label: 'Word to PDF', icon: FileText },
  { href: '/pdf-to-png', label: 'PDF to Image', icon: ImageIcon },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className={`${styles.navbarContainer} ${styles.desktopOnly}`}>
      <nav className={styles.navbarPill}>
        <Link href="/" className={styles.logoLink} title="Home">
          <Logo size={24} showText={false} />
        </Link>
        
        <div className={styles.divider} />

        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              title={link.label}
            >
              <Icon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>{link.label}</span>
            </Link>
          );
        })}

        <div className={styles.divider} />

        <Link
          href="/#search" 
          className={styles.navItem}
          title="Search Tools"
          onClick={(e) => {
             // If we are on homepage, maybe focus search? 
             // For now just linking to generic anchor or just /
          }}
        >
            <Search size={18} className={styles.navIcon} />
            <span className={styles.navLabel}>Search</span>
        </Link>

      </nav>
    </div>
  );
}
