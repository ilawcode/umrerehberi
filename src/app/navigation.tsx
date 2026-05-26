'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './theme-provider';
import styles from './navigation.module.css';
import { useChat } from './chat-provider';

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { unreadCount } = useChat();


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkSupport = () => {
      const docEl = document.documentElement as any;
      return !!(
        document.fullscreenEnabled ||
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen
      );
    };

    setIsSupported(checkSupport());

    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      ));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const docEl = document.documentElement as any;
      const doc = document as any;

      if (!document.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

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
        <div className={styles.headerActions}>
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
          {isSupported && (
            <button 
              onClick={toggleFullscreen} 
              className={styles.fullscreenBtn}
              title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          )}
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

        <Link href="/sohbet" className={`${styles.navItem} ${pathname === '/sohbet' ? styles.activeNav : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M21 11.5a8.38 8.38 0 0 0-1.71-5.09L12 2 4.71 6.41a8.38 8.38 0 0 0-1.71 5.09v5.5c0 .79.32 1.54.88 2.08L6 21l5-3h5c.79 0 1.54-.32 2.08-.88L21 12.5z" />
          </svg>
          <span>Grup Sohbet</span>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount}</span>
          )}
        </Link>

        <Link href="/aile" className={`${styles.navItem} ${pathname === '/aile' ? styles.activeNav : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Ailem</span>
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
