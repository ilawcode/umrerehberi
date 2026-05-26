'use client';

import React, { useState, useEffect } from 'react';
import { defaultPrayers } from '@/lib/seedData';
import styles from './sayac.module.css';

type Mode = 'tawaf' | 'say';

export default function CounterPage() {
  const [mode, setMode] = useState<Mode>('tawaf');
  const [count, setCount] = useState<number>(0);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if vibration is supported in the browser
    if (typeof window !== 'undefined' && !('vibrate' in navigator)) {
      setVibrationEnabled(false);
    }
  }, []);

  const triggerVibration = () => {
    if (vibrationEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(80);
    }
  };

  const handleIncrement = () => {
    if (count < 7) {
      const newCount = count + 1;
      setCount(newCount);
      triggerVibration();
    }
  };

  const handleDecrement = () => {
    if (count > 0) {
      setCount(count - 1);
      triggerVibration();
    }
  };

  const handleReset = () => {
    if (confirm('Sayacı sıfırlamak istediğinize emin misiniz?')) {
      setCount(0);
      triggerVibration();
    }
  };

  const handleModeChange = (newMode: Mode) => {
    if (count === 0 || confirm('Sayaç modunu değiştirirseniz mevcut sayınız sıfırlanacaktır. Devam etmek istiyor musunuz?')) {
      setMode(newMode);
      setCount(0);
      triggerVibration();
    }
  };

  // Get relevant prayers based on mode and current round
  const getRelevantPrayers = () => {
    if (mode === 'tawaf') {
      if (count === 0) {
        return defaultPrayers.filter(p => p.title.includes('Niyeti') || p.title.includes('Başlarken'));
      } else if (count === 7) {
        return defaultPrayers.filter(p => p.title.includes('Makam-ı İbrahim'));
      } else {
        return defaultPrayers.filter(p => p.title.includes('Tavaf Esnasında') || p.title.includes('Başlarken'));
      }
    } else { // say mode
      if (count === 0) {
        return defaultPrayers.filter(p => p.title.includes('Safa Tepesine'));
      } else if (count === 7) {
        return defaultPrayers.filter(p => p.title.includes('Merve Tepesinde') || p.title.includes('Tıraş'));
      } else {
        return defaultPrayers.filter(p => p.title.includes('Sa\'y Esnasında') || p.title.includes('Merve Tepesinde'));
      }
    }
  };

  const relevantPrayers = getRelevantPrayers();

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      {/* Mode Tabs */}
      <div className={styles.modeToggle}>
        <button
          id="mode-tawaf-btn"
          className={`${styles.modeBtn} ${mode === 'tawaf' ? styles.activeMode : ''}`}
          onClick={() => handleModeChange('tawaf')}
        >
          Kabe Tavafı
        </button>
        <button
          id="mode-say-btn"
          className={`${styles.modeBtn} ${mode === 'say' ? styles.activeMode : ''}`}
          onClick={() => handleModeChange('say')}
        >
          Safa - Merve Sa'yi
        </button>
      </div>

      {/* Main Counter area */}
      <div className={`${styles.counterCard} card`}>
        <div className={styles.counterHeader}>
          <span className={styles.shawtLabel}>
            {mode === 'tawaf' ? 'Tavaf Şavtı' : 'Sa\'y Şavtı'}
          </span>
          <button
            id="vibration-toggle-btn"
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
            className={`${styles.vibToggle} ${vibrationEnabled ? styles.vibOn : ''}`}
            title="Titreşim Geri Bildirimi"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M12 3v18M8 5v14M4 8v8M16 5v14M20 8v8" />
            </svg>
            <span>{vibrationEnabled ? 'Titreşim Açık' : 'Titreşim Kapalı'}</span>
          </button>
        </div>

        {/* Big Circle Button */}
        <div className={styles.circleContainer}>
          <button
            id="counter-increment-btn"
            className={`${styles.incrementBtn} ${count === 7 ? styles.doneBtn : ''}`}
            onClick={handleIncrement}
            disabled={count === 7}
          >
            {count === 7 ? (
              <div className={styles.doneText}>
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="3" fill="none">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Tamamlandı!</span>
              </div>
            ) : (
              <div className={styles.counterNum}>
                <span className={styles.currentNum}>{count}</span>
                <span className={styles.slash}>/</span>
                <span className={styles.totalNum}>7</span>
              </div>
            )}
          </button>
        </div>

        {/* Subtitle / Round Info */}
        <div className={styles.infoText}>
          {count === 0 && (
            <p>Başlamak için yeşil alana dokunun. Her tur bitiminde butona basın.</p>
          )}
          {count > 0 && count < 7 && (
            <p>Şu an <strong>{count}. şavtı</strong> tamamladınız. Sıradaki şavta başlayın.</p>
          )}
          {count === 7 && (
            <p className={styles.successMsg}>
              Tebrikler! 7 şavtı tamamlayarak {mode === 'tawaf' ? 'Tavafınızı' : 'Sa\'yinizi'} bitirdiniz.
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className={styles.actionRow}>
          <button
            id="counter-dec-btn"
            onClick={handleDecrement}
            disabled={count === 0}
            className={styles.actionBtn}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Geri Al
          </button>
          <button
            id="counter-reset-btn"
            onClick={handleReset}
            className={styles.actionBtn}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Sıfırla
          </button>
        </div>
      </div>

      {/* Inline Prayer Helper */}
      <div className={styles.prayerHelper}>
        <h4 className={styles.helperTitle}>
          {count === 7 ? 'Sıradaki Adım Duası' : count === 0 ? 'Başlangıç Duaları' : `${count}. Şavt Duası`}
        </h4>
        <div className={styles.prayersList}>
          {relevantPrayers.map((prayer, index) => (
            <div key={index} className={`${styles.prayerCard} card`}>
              <h5 className={styles.prayerTitle}>{prayer.title}</h5>
              <div className="arabic-text" style={{ fontSize: '1.8rem', lineHeight: '3.6rem' }}>
                {prayer.arabic}
              </div>
              <div className={styles.prayerSec}>
                <span className={styles.secLabel}>Okunuşu:</span>
                <p className={styles.secText}>{prayer.transliteration}</p>
              </div>
              <div className={styles.prayerSec}>
                <span className={styles.secLabel}>Meali:</span>
                <p className={styles.secText}>{prayer.translation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
