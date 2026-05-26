'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from './theme-provider';
import { defaultPrayers, defaultRules, defaultPlaces } from '@/lib/seedData';
import styles from './page.module.css';

type ActiveTab = 'prayers' | 'rules' | 'places';

interface Prayer {
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  category: string;
}

interface Rule {
  title: string;
  description: string;
  category: string;
  penalty: string;
}

interface Place {
  title: string;
  description: string;
  city: string;
  importance: string;
  order: number;
}

export default function DashboardPage() {
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('prayers');
  const [mounted, setMounted] = useState(false);

  // Data states with fallbacks
  const [prayers, setPrayers] = useState<Prayer[]>(defaultPrayers);
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [places, setPlaces] = useState<Place[]>(defaultPlaces);

  // Filtering & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activePrayerCategory, setActivePrayerCategory] = useState('all');
  const [activeRuleCategory, setActiveRuleCategory] = useState('all');
  const [activePlaceCity, setActivePlaceCity] = useState<string>('all');

  // Interactive controls
  const [arabicFontSize, setArabicFontSize] = useState<number>(2.0); // rem
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch prayers
      const pRes = await fetch('/api/prayers');
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.success && pData.data?.length > 0) setPrayers(pData.data);
      }
      
      // Fetch rules
      const rRes = await fetch('/api/rules');
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.success && rData.data?.length > 0) setRules(rData.data);
      }

      // Fetch places
      const plRes = await fetch('/api/places');
      if (plRes.ok) {
        const plData = await plRes.json();
        if (plData.success && plData.data?.length > 0) setPlaces(plData.data);
      }
    } catch (e) {
      console.warn('API error, using offline seed data:', e);
    }
  };

  const toggleExpand = (title: string) => {
    setExpandedItem(expandedItem === title ? null : title);
  };

  if (!mounted) return null;

  // Filters logic
  const filteredPrayers = prayers.filter(p => {
    const matchesCategory = activePrayerCategory === 'all' || p.category === activePrayerCategory;
    const matchesSearch = searchQuery === '' || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transliteration.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredRules = rules.filter(r => {
    const matchesCategory = activeRuleCategory === 'all' || r.category === activeRuleCategory;
    const matchesSearch = searchQuery === '' || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredPlaces = places.filter(pl => {
    const matchesCity = activePlaceCity === 'all' || pl.city === activePlaceCity;
    const matchesSearch = searchQuery === '' || 
      pl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const prayerCategories = [
    { id: 'all', label: 'Tümü' },
    { id: 'ihram', label: 'İhram' },
    { id: 'tawaf', label: 'Tavaf' },
    { id: 'say', label: 'Sa\'y' },
    { id: 'general', label: 'Genel' },
    { id: 'visit', label: 'Ziyaret' },
    { id: 'risale', label: 'Risale-i Nur\'daki Dualar' }
  ];

  const ruleCategories = [
    { id: 'all', label: 'Tümü' },
    { id: 'body', label: 'Beden' },
    { id: 'clothing', label: 'Giyim' },
    { id: 'behavior', label: 'Davranış' },
    { id: 'general', label: 'Çevre' }
  ];

  return (
    <div className={styles.dashboard}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeOverlay}>
          <div className={styles.kaabaBadge}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <rect x="3" y="9" width="18" height="12" rx="1" />
              <path d="M3 13H21" stroke="#d97706" strokeWidth="2" />
              <path d="M12 5L3 9L12 13L21 9L12 5Z" opacity="0.8" />
            </svg>
          </div>
          <div>
            <h2>Umre Rehberi</h2>
            <p>Kişisel İbadet ve Bilgi Paneli</p>
          </div>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className={styles.statsGrid}>
        <button 
          id="stat-prayers-btn"
          className={`${styles.statCard} ${activeTab === 'prayers' ? styles.activeStatCard : ''}`}
          onClick={() => { setActiveTab('prayers'); setSearchQuery(''); }}
        >
          <span className={styles.statCount}>{prayers.length}</span>
          <span className={styles.statLabel}>Okunacak Dua</span>
        </button>

        <button 
          id="stat-rules-btn"
          className={`${styles.statCard} ${activeTab === 'rules' ? styles.activeStatCard : ''}`}
          onClick={() => { setActiveTab('rules'); setSearchQuery(''); }}
        >
          <span className={styles.statCount}>{rules.length}</span>
          <span className={styles.statLabel}>İhram Yasağı</span>
        </button>

        <button 
          id="stat-places-btn"
          className={`${styles.statCard} ${activeTab === 'places' ? styles.activeStatCard : ''}`}
          onClick={() => { setActiveTab('places'); setSearchQuery(''); }}
        >
          <span className={styles.statCount}>{places.length}</span>
          <span className={styles.statLabel}>Ziyaret Alanı</span>
        </button>
      </div>

      {/* Segmented Controller */}
      <div className={styles.segmentedControl}>
        <button 
          id="tab-prayers"
          className={`${styles.segmentBtn} ${activeTab === 'prayers' ? styles.activeSegment : ''}`}
          onClick={() => { setActiveTab('prayers'); setSearchQuery(''); }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Dualar
        </button>
        <button 
          id="tab-rules"
          className={`${styles.segmentBtn} ${activeTab === 'rules' ? styles.activeSegment : ''}`}
          onClick={() => { setActiveTab('rules'); setSearchQuery(''); }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Yasaklar
        </button>
        <button 
          id="tab-places"
          className={`${styles.segmentBtn} ${activeTab === 'places' ? styles.activeSegment : ''}`}
          onClick={() => { setActiveTab('places'); setSearchQuery(''); }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Ziyaretler
        </button>
      </div>

      {/* Common Search Box */}
      <div className={styles.searchContainer}>
        <input
          id="dashboard-search-input"
          type="text"
          placeholder={`${activeTab === 'prayers' ? 'Dua' : activeTab === 'rules' ? 'Yasak' : 'Mekan'} ara...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button 
            id="dashboard-clear-search"
            onClick={() => setSearchQuery('')} 
            className={styles.clearSearchBtn}
          >
            Temizle
          </button>
        )}
      </div>

      {/* RENDER ACTIVE VIEW */}
      
      {/* 1. DUALAR (PRAYERS) AREA */}
      {activeTab === 'prayers' && (
        <div className={styles.tabContent}>
          {/* Quick Sub-Categories */}
          <div className={styles.subFilterScroll}>
            {prayerCategories.map(cat => (
              <button
                id={`subcat-prayer-${cat.id}`}
                key={cat.id}
                onClick={() => setActivePrayerCategory(cat.id)}
                className={`${styles.subFilterBtn} ${activePrayerCategory === cat.id ? styles.activeSubFilter : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Font Controls */}
          <div className={styles.fontControls}>
            <span>Arapça Yazı Boyutu:</span>
            <button id="font-dec-dash" onClick={() => setArabicFontSize(Math.max(1.4, arabicFontSize - 0.2))} className={styles.fontBtn}>A-</button>
            <span className={styles.fontVal}>{arabicFontSize.toFixed(1)}</span>
            <button id="font-inc-dash" onClick={() => setArabicFontSize(Math.min(3.0, arabicFontSize + 0.2))} className={styles.fontBtn}>A+</button>
          </div>

          <div className={styles.list}>
            {filteredPrayers.length > 0 ? (
              filteredPrayers.map((p, idx) => {
                const isExpanded = expandedItem === p.title;
                return (
                  <div 
                    key={idx} 
                    className={`${styles.itemCard} ${isExpanded ? styles.itemExpanded : ''} card`}
                    onClick={() => toggleExpand(p.title)}
                  >
                    <div className={styles.itemHeader}>
                      <span className={styles.badgeAmber}>
                        {prayerCategories.find(c => c.id === p.category)?.label}
                      </span>
                      <h4 className={styles.itemTitle}>{p.title}</h4>
                      <svg className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    <div className="arabic-text" style={{ fontSize: `${arabicFontSize}rem`, lineHeight: `${arabicFontSize * 2.0}rem`, display: isExpanded ? 'block' : 'none' }}>
                      {p.arabic}
                    </div>

                    {isExpanded && (
                      <div className={styles.itemBody} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.textSection}>
                          <h5>Türkçe Okunuşu:</h5>
                          <p className={styles.transliteration}>{p.transliteration}</p>
                        </div>
                        <div className={styles.textSection}>
                          <h5>Türkçe Meali:</h5>
                          <p className={styles.translation}>{p.translation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.empty}>Aradığınız dua bulunamadı.</div>
            )}
          </div>
        </div>
      )}

      {/* 2. İHRAM YASAKLARI (RULES) AREA */}
      {activeTab === 'rules' && (
        <div className={styles.tabContent}>
          {/* Quick Sub-Categories */}
          <div className={styles.subFilterScroll}>
            {ruleCategories.map(cat => (
              <button
                id={`subcat-rule-${cat.id}`}
                key={cat.id}
                onClick={() => setActiveRuleCategory(cat.id)}
                className={`${styles.subFilterBtn} ${activeRuleCategory === cat.id ? styles.activeSubFilter : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className={styles.list}>
            {filteredRules.length > 0 ? (
              filteredRules.map((r, idx) => {
                const isExpanded = expandedItem === r.title;
                return (
                  <div 
                    key={idx} 
                    className={`${styles.itemCard} ${isExpanded ? styles.itemExpanded : ''} card`}
                    onClick={() => toggleExpand(r.title)}
                  >
                    <div className={styles.itemHeader}>
                      <span className={styles.badgeRed}>
                        {ruleCategories.find(c => c.id === r.category)?.label}
                      </span>
                      <h4 className={styles.itemTitle}>{r.title}</h4>
                      <svg className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {isExpanded && (
                      <div className={styles.itemBody} onClick={(e) => e.stopPropagation()}>
                        <p className={styles.description}>{r.description}</p>
                        
                        <div className={styles.penaltyBox}>
                          <div className={styles.penaltyHeader}>
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>Ceza / Çözüm:</span>
                          </div>
                          <p className={styles.penaltyText}>{r.penalty}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.empty}>Aradığınız yasak bulunamadı.</div>
            )}
          </div>
        </div>
      )}

      {/* 3. ZİYARET EDİLECEK ALANLAR (PLACES) AREA */}
      {activeTab === 'places' && (
        <div className={styles.tabContent}>
          {/* Quick City Filters */}
          <div className={styles.subFilterScroll}>
            <button
              id="city-filter-all"
              onClick={() => setActivePlaceCity('all')}
              className={`${styles.subFilterBtn} ${activePlaceCity === 'all' ? styles.activeSubFilter : ''}`}
            >
              Tüm Şehirler
            </button>
            <button
              id="city-filter-mekke"
              onClick={() => setActivePlaceCity('Mekke')}
              className={`${styles.subFilterBtn} ${activePlaceCity === 'Mekke' ? styles.activeSubFilter : ''}`}
            >
              Mekke
            </button>
            <button
              id="city-filter-medine"
              onClick={() => setActivePlaceCity('Medine')}
              className={`${styles.subFilterBtn} ${activePlaceCity === 'Medine' ? styles.activeSubFilter : ''}`}
            >
              Medine
            </button>
          </div>

          <div className={styles.list}>
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((pl, idx) => {
                const isExpanded = expandedItem === pl.title;
                return (
                  <div 
                    key={idx} 
                    className={`${styles.itemCard} ${isExpanded ? styles.itemExpanded : ''} card`}
                    onClick={() => toggleExpand(pl.title)}
                  >
                    <div className={styles.itemHeader}>
                      <span className={pl.city === 'Mekke' ? styles.badgeMakkah : styles.badgeMedina}>
                        {pl.city}
                      </span>
                      <h4 className={styles.itemTitle}>{pl.title}</h4>
                      <svg className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {isExpanded && (
                      <div className={styles.itemBody} onClick={(e) => e.stopPropagation()}>
                        <p className={styles.description}>{pl.description}</p>
                        
                        <div className={styles.importanceBox}>
                          <div className={styles.importanceHeader}>
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            <span>Önemi & Fazileti:</span>
                          </div>
                          <p className={styles.importanceText}>{pl.importance}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.empty}>Aradığınız ziyaret alanı bulunamadı.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
