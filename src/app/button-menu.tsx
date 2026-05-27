'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

const tabs = [
  {
    id: 'prayers',
    label: 'Dualar',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: 'rules',
    label: 'Yasaklar',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'places',
    label: 'Ziyaretler',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

export default function ButtonMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine which tab is active based on the current URL
  const currentTab = pathname === '/' ? (searchParams?.get('tab') ?? 'prayers') : null;

  return (
    <div className={styles.persistentMenu}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`menu-btn-${tab.id}`}
            className={`${styles.menuBtn} ${isActive ? styles.menuBtnActive : ''}`}
            onClick={() => router.push(`/?tab=${tab.id}`)}
          >
            <span className={styles.menuBtnIcon}>{tab.icon}</span>
            <span className={styles.menuBtnLabel}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
