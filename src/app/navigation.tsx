'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './theme-provider';
import styles from './navigation.module.css';

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className={`${styles.header} glass`}>
        <div className={styles.logoArea}>
          <svg className={styles.kaabaIcon} viewBox="0 0 24 24" width="24" height="24">
            <rect x="3" y="9" width="18" height="12" fill="currentColor" rx="1" />
            <path d="M3 13H21" stroke="var(--secondary)" strokeWidth="2" />
            <path d="M12 9V21" stroke="var(--secondary)" strokeWidth="1" strokeDasharray="2" />
            <path d="M12 5L3 9L12 13L21 9L12 5Z" fill="currentColor" opacity="0.8" />
          </svg>
          <span className={styles.title}>Umre Rehberi</span>
        </div>
        <div className={styles.themeToggle}>
          <button 
            onClick={() => setTheme('light')} 
            className={`${styles.themeBtn} ${theme === 'light' ? styles.activeTheme : ''}`}
            title="Açık Mod"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </button>
          <button 
            onClick={() => setTheme('dark')} 
            className={`${styles.themeBtn} ${theme === 'dark' ? styles.activeTheme : ''}`}
            title="Koyu Mod"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
          <button 
            onClick={() => setTheme('sunlight')} 
            className={`${styles.themeBtn} ${theme === 'sunlight' ? styles.activeTheme : ''}`}
            title="Güneş Işığı Modu"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="12" r="3" />
              <line x1="9" y1="12" x2="15" y2="12" strokeWidth="3" />
              <path d="M3 12C3 7 6 6 12 6C18 6 21 7 21 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="animate-fade-in">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={`${styles.bottomNav} glass`}>
        <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.activeNav : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          <span>Rehber</span>
        </Link>

        <Link href="/dualar" className={`${styles.navItem} ${pathname === '/dualar' ? styles.activeNav : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>Dualar</span>
        </Link>

        <Link href="/sayac" className={`${styles.navItem} ${pathname === '/sayac' ? styles.activeNav : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Sayaç</span>
        </Link>

        <Link href="/yasaklar" className={`${styles.navItem} ${pathname === '/yasaklar' ? styles.activeNav : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Yasaklar</span>
        </Link>

        <Link href="/notlar" className={`${styles.navItem} ${pathname === '/notlar' ? styles.activeNav : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Notlarım</span>
        </Link>
      </nav>
    </div>
  );
}
