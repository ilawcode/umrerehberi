'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { defaultPrayers } from '@/lib/seedData';
import styles from './dualar.module.css';

interface PrayerData {
  _id?: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  category: string;
}

function PrayersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [prayers, setPrayers] = useState<PrayerData[]>(defaultPrayers);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [arabicFontSize, setArabicFontSize] = useState<number>(2.2); // rem
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [expandedPrayers, setExpandedPrayers] = useState<Record<string, boolean>>({});

  // Read URL search params (e.g. from the guide page redirection)
  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  // Scroll to top when active category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  // Fetch prayers from database, fallback to seed data on error/offline
  useEffect(() => {
    async function loadPrayers() {
      try {
        setLoading(true);
        const res = await fetch('/api/prayers');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.length > 0) {
            setPrayers(json.data);
          }
        }
      } catch (e) {
        console.warn('API connection failed, using offline seed data:', e);
        // Fallback to defaultPrayers (already set as initial state)
      } finally {
        setLoading(false);
      }
    }
    loadPrayers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Clear URL query to not confuse the user
    if (searchParams.get('search')) {
      router.replace('/dualar');
    }
  };

  const increaseFontSize = () => {
    if (arabicFontSize < 3.5) {
      setArabicFontSize(prev => parseFloat((prev + 0.2).toFixed(1)));
    }
  };

  const decreaseFontSize = () => {
    if (arabicFontSize > 1.6) {
      setArabicFontSize(prev => parseFloat((prev - 0.2).toFixed(1)));
    }
  };

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'ihram', label: 'İhram' },
    { id: 'tawaf', label: 'Tavaf' },
    { id: 'say', label: 'Sa\'y' },
    { id: 'general', label: 'Genel' },
    { id: 'visit', label: 'Ziyaret' },
    { id: 'risale', label: 'Risale-i Nur\'daki Dualar' }
  ];

  // Filter logic
  const filteredPrayers = prayers.filter(prayer => {
    const matchesCategory = activeCategory === 'all' || prayer.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      prayer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prayer.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prayer.translation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (title: string, id: string) => {
    const isCurrentlyExpanded = !!expandedPrayers[title];
    const isExpanding = !isCurrentlyExpanded; // If it wasn't expanded, we are expanding it.
    
    setExpandedPrayers(prev => ({
      ...prev,
      [title]: !isCurrentlyExpanded
    }));

    if (isExpanding) {
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const headerHeight = 72; // height of sticky header + small padding offset
          const elementPosition = element.getBoundingClientRect().top;
          const currentScroll = window.scrollY || window.pageYOffset || 0;
          const offsetPosition = elementPosition + currentScroll - headerHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 150); // Timeout increased to 150ms to ensure the React DOM has finished rendering and layout updates
    }
  };

  const isAllExpanded = filteredPrayers.length > 0 && filteredPrayers.every(prayer => expandedPrayers[prayer.title]);

  const toggleAllPrayers = () => {
    if (isAllExpanded) {
      // Collapse all filtered prayers
      const newExpanded = { ...expandedPrayers };
      filteredPrayers.forEach(p => {
        delete newExpanded[p.title];
      });
      setExpandedPrayers(newExpanded);
    } else {
      // Expand all filtered prayers
      const newExpanded = { ...expandedPrayers };
      filteredPrayers.forEach(p => {
        newExpanded[p.title] = true;
      });
      setExpandedPrayers(newExpanded);
    }
  };

  return (
    <div className={styles.container}>
      {/* Search and Controls */}
      <div className={`${styles.searchBox} card`}>
        <div className={styles.searchRow}>
          <input
            id="prayer-search-input"
            type="text"
            placeholder="Dua ara (Türkçe veya Arapça)..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button 
              id="clear-search-btn"
              onClick={() => setSearchQuery('')} 
              className={styles.clearBtn}
            >
              Temizle
            </button>
          )}
        </div>

        {/* Font size and view controls */}
        <div className={styles.controlRow}>
          <div className={styles.fontSizeControls}>
            <span className={styles.controlLabel}>Yazı Boyutu:</span>
            <button id="font-dec-btn" onClick={decreaseFontSize} className={styles.circleBtn}>A-</button>
            <span className={styles.fontVal}>{arabicFontSize.toFixed(1)}</span>
            <button id="font-inc-btn" onClick={increaseFontSize} className={styles.circleBtn}>A+</button>
          </div>
          <div className={styles.toggles}>
            <button 
              id="toggle-all-btn"
              onClick={toggleAllPrayers} 
              className={`${styles.toggleBtn} ${isAllExpanded ? styles.toggleActive : ''}`}
            >
              Hepsi Açık
            </button>
            <button 
              id="toggle-trans-btn"
              onClick={() => setShowTransliteration(!showTransliteration)} 
              className={`${styles.toggleBtn} ${showTransliteration ? styles.toggleActive : ''}`}
            >
              Okunuş
            </button>
            <button 
              id="toggle-meal-btn"
              onClick={() => setShowTranslation(!showTranslation)} 
              className={`${styles.toggleBtn} ${showTranslation ? styles.toggleActive : ''}`}
            >
              Meal
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsScroll}>
          {categories.map(cat => (
            <button
              id={`cat-tab-${cat.id}`}
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`${styles.tab} ${activeCategory === cat.id ? styles.activeTab : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prayers List */}
      <div className={styles.prayersList}>
        {loading ? (
          <div className={styles.loadingState}>Dualar yükleniyor...</div>
        ) : filteredPrayers.length > 0 ? (
          filteredPrayers.map((prayer, index) => {
            const isExpanded = !!expandedPrayers[prayer.title];
            const cardId = `prayer-card-${index}`;
            return (
              <div 
                key={prayer._id || index} 
                id={cardId}
                className={`${styles.prayerCard} ${isExpanded ? styles.prayerCardExpanded : ''} card`}
                onClick={() => toggleExpand(prayer.title, cardId)}
              >
                <div className={styles.prayerHeader}>
                  <span className={styles.categoryBadge}>{categories.find(c => c.id === prayer.category)?.label}</span>
                  <h3 className={styles.prayerTitle}>{prayer.title}</h3>
                  <svg className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                
                {isExpanded && (
                  <div className={styles.prayerBody} onClick={(e) => e.stopPropagation()}>
                    <div 
                      className="arabic-text" 
                      style={{ fontSize: `${arabicFontSize}rem`, lineHeight: `${arabicFontSize * 2.0}rem` }}
                    >
                      {prayer.arabic}
                    </div>

                    {showTransliteration && (
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Türkçe Okunuşu:</h4>
                        <p className={styles.transliterationText}>{prayer.transliteration}</p>
                      </div>
                    )}

                    {showTranslation && (
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Meali:</h4>
                        <p className={styles.translationText}>{prayer.translation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>Aradığınız kriterlere uygun dua bulunamadı.</div>
        )}
      </div>
    </div>
  );
}

export default function PrayersPage() {
  return (
    <Suspense fallback={<div className={styles.loadingState}>Sayfa yükleniyor...</div>}>
      <PrayersContent />
    </Suspense>
  );
}
