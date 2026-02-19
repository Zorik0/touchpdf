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
  Lock
} from 'lucide-react';
import Logo from './Logo';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/merge-pdf', label: 'Merge', icon: Combine },
  { href: '/split-pdf', label: 'Split', icon: Scissors },
  { href: '/compress-pdf', label: 'Compress', icon: Minimize2 },
  { href: '/rotate-pdf', label: 'Rotate', icon: RotateCw },
  { href: '/watermark-pdf', label: 'Watermark', icon: Droplets },
  { href: '/protect-pdf', label: 'Protect', icon: Lock },
  { href: '/invert', label: 'Invert', icon: ArrowRightLeft },
  { href: '/md-to-pdf', label: 'MD→PDF', icon: FileText },
  { href: '/extract-text', label: 'Text', icon: Type },
  { href: '/pdf-to-png', label: 'PDF→IMG', icon: ImageIcon },
  { href: '/png-to-pdf', label: 'IMG→PDF', icon: FileStack },
  { href: '/organize', label: 'Organize', icon: Layers },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className={styles.navbarContainer}>
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
            >
              <Icon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
