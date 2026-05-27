'use client';

import { useRouter } from 'next/navigation';
import styles from './landing.module.css';

const sections = [
  {
    id: 'dualar',
    href: '/rehber?tab=prayers',
    label: 'Dualar',
    subtitle: 'İhram, Tavaf, Sa\'y duaları',
    color: 'emerald',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="1.8" fill="none">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: 'yasaklar',
    href: '/rehber?tab=rules',
    label: 'İhram Yasakları',
    subtitle: 'Cezalar ve kurallar',
    color: 'red',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="1.8" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'ziyaret',
    href: '/rehber?tab=places',
    label: 'Ziyaret Yerleri',
    subtitle: 'Mekke & Medine',
    color: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="1.8" fill="none">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: 'sayac',
    href: '/sayac',
    label: 'Sayaç',
    subtitle: 'Tavaf & Sa\'y takip',
    color: 'amber',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="1.8" fill="none">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'aile',
    href: '/aile',
    label: 'Ailem',
    subtitle: 'Konum & Grup Sohbet',
    color: 'purple',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="1.8" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'notlar',
    href: '/notlar',
    label: 'Notlarım',
    subtitle: 'Kişisel notlar',
    color: 'teal',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="1.8" fill="none">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className={styles.landing}>
      {/* Hero Banner */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroKaaba}>
          <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor">
            <rect x="3" y="9" width="18" height="12" rx="1" />
            <path d="M3 13H21" stroke="#d97706" strokeWidth="2" />
            <path d="M12 9V21" stroke="#d97706" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
            <path d="M12 5L3 9L12 13L21 9L12 5Z" opacity="0.8" />
          </svg>
        </div>
        <h1 className={styles.heroTitle}>Umre Rehberi</h1>
        <p className={styles.heroSub}>Kişisel İbadet Yardımcınız</p>
      </div>

      {/* Section Grid */}
      <div className={styles.grid}>
        {sections.map((s) => (
          <button
            key={s.id}
            id={`landing-btn-${s.id}`}
            className={`${styles.card} ${styles[`card_${s.color}`]}`}
            onClick={() => router.push(s.href)}
          >
            <span className={styles.cardIcon}>{s.icon}</span>
            <span className={styles.cardLabel}>{s.label}</span>
            <span className={styles.cardSub}>{s.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
