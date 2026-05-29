'use client';

import React, { useState, useEffect } from 'react';
import { defaultRules } from '@/lib/seedData';
import { useCachedFetch } from '@/lib/offlineCache';
import styles from './yasaklar.module.css';

interface RuleData {
  _id?: string;
  title: string;
  description: string;
  category: string;
  penalty: string;
}

export default function RulesPage() {
  const { data: rules, loading } = useCachedFetch<RuleData[]>(
    'umre_cache_rules',
    '/api/rules',
    defaultRules
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');


  // Scroll to top when active category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'body', label: 'Beden & Bakım' },
    { id: 'clothing', label: 'Giyim' },
    { id: 'behavior', label: 'Davranış' },
    { id: 'general', label: 'Genel & Çevre' }
  ];

  const filteredRules = rules.filter(rule => {
    return activeCategory === 'all' || rule.category === activeCategory;
  });

  return (
    <div className={styles.container}>
      {/* Introduction Card */}
      <div className={`${styles.introCard} card`}>
        <h3 className={styles.introTitle}>İhram Yasakları</h3>
        <p className={styles.introText}>
          Niyet edip telbiye getirerek ihrama girildikten sonra, ihramdan çıkana kadar yapılması yasak olan bazı hususlar vardır. Bu yasakların çiğnenmesi durumuna göre ceza (Dem, Sadaka veya Oruç) gerekir.
        </p>
      </div>

      {/* Category Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsScroll}>
          {categories.map(cat => (
            <button
              id={`rule-cat-${cat.id}`}
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`${styles.tab} ${activeCategory === cat.id ? styles.activeTab : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className={styles.rulesList}>
        {loading ? (
          <div className={styles.loadingState}>Yasaklar yükleniyor...</div>
        ) : filteredRules.length > 0 ? (
          filteredRules.map((rule, index) => (
            <div key={rule._id || index} className={`${styles.ruleCard} card`}>
              <div className={styles.ruleHeader}>
                <span className={`${styles.badge} ${styles[rule.category]}`}>
                  {categories.find(c => c.id === rule.category)?.label}
                </span>
                <h4 className={styles.ruleTitle}>{rule.title}</h4>
              </div>
              
              <p className={styles.description}>{rule.description}</p>
              
              {/* Penalty (Cezası) */}
              <div className={styles.penaltyBox}>
                <div className={styles.penaltyHeader}>
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Cezası / Çözüm:</span>
                </div>
                <p className={styles.penaltyText}>{rule.penalty}</p>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>Seçilen kategoride yasak bulunamadı.</div>
        )}
      </div>
    </div>
  );
}
