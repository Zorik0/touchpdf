'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Combine,
  Scissors,
  Minimize2,
  Layers,
  FileText,
  LayoutGrid,
} from 'lucide-react';
import Logo from './Logo';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/merge-pdf', label: 'Merge', icon: Combine },
  { href: '/split-pdf', label: 'Split', icon: Scissors },
  { href: '/compress-pdf', label: 'Compress', icon: Minimize2 },
  { href: '/organize', label: 'Organize', icon: Layers },
  { href: '/pdf-to-word', label: 'Convert', icon: FileText },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className={`${styles.navbarContainer} ${styles.desktopOnly}`}>
      <nav className={styles.navbarPill}>
        <Link href="/" className={styles.logoLink} title="TouchPDF home">
          <Logo size={22} showText={false} />
          <span className={styles.logoText}>touch<em>pdf</em></span>
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
            >
              <Icon size={15} />
              <span>{link.label}</span>
            </Link>
          );
        })}

        <div className={styles.divider} />

        <Link href="/" className={`${styles.navItem} ${styles.allTools}`}>
          <LayoutGrid size={15} />
          <span>All tools</span>
        </Link>
      </nav>
    </div>
  );
}
