'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { defaultSteps } from '@/lib/seedData';
import styles from './page.module.css';

interface CompletedSteps {
  [key: number]: boolean;
}

export default function GuidePage() {
  const [completed, setCompleted] = useState<CompletedSteps>({});
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('umre_completed_steps');
    if (saved) {
      try {
        setCompleted(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    setMounted(true);
  }, []);

  const toggleStep = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion toggle
    const updated = {
      ...completed,
      [id]: !completed[id],
    };
    setCompleted(updated);
    localStorage.setItem('umre_completed_steps', JSON.stringify(updated));
  };

  const toggleAccordion = (id: number) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  const resetProgress = () => {
    if (confirm('İlerlemenizi sıfırlamak istediğinize emin misiniz?')) {
      setCompleted({});
      localStorage.removeItem('umre_completed_steps');
      setExpandedStep(1);
    }
  };

  const totalSteps = defaultSteps.length;
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay}>
          <h1>Umre Rehberim</h1>
          <p>Manevi yolculuğunuzda adım adım rehberiniz</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="card">
        <div className={styles.progressHeader}>
          <div>
            <h3 className={styles.progressTitle}>Umre İlerlemesi</h3>
            <p className={styles.progressSub}>{completedCount} / {totalSteps} Adım Tamamlandı</p>
          </div>
          {completedCount > 0 && (
            <button 
              id="reset-progress-btn" 
              onClick={resetProgress} 
              className={styles.resetBtn}
            >
              Sıfırla
            </button>
          )}
        </div>
        <div className={styles.progressBarBg}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className={styles.stepsList}>
        {defaultSteps.map((step) => {
          const isDone = completed[step.id];
          const isExpanded = expandedStep === step.id;

          return (
            <div 
              key={step.id} 
              className={`${styles.stepCard} ${isDone ? styles.stepDone : ''} ${isExpanded ? styles.stepActive : ''} card`}
              onClick={() => toggleAccordion(step.id)}
            >
              {/* Step Header */}
              <div className={styles.stepHeader}>
                <button
                  id={`check-step-${step.id}`}
                  onClick={(e) => toggleStep(step.id, e)}
                  className={`${styles.checkbox} ${isDone ? styles.checked : ''}`}
                  aria-label={`${step.title} adımını tamamlandı olarak işaretle`}
                >
                  {isDone && (
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                
                <div className={styles.stepTitleArea}>
                  <span className={styles.stepNum}>Adım {step.id}</span>
                  <h4 className={styles.stepTitle}>{step.title}</h4>
                </div>

                <div className={`${styles.arrow} ${isExpanded ? styles.arrowExpanded : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Step Details (Accordion Body) */}
              {isExpanded && (
                <div className={styles.stepBody} onClick={(e) => e.stopPropagation()}>
                  <p className={styles.description}>{step.description}</p>
                  
                  <div className={styles.checklist}>
                    <h5>Yapılacaklar:</h5>
                    <ul>
                      {step.details.map((detail, index) => (
                        <li key={index} className={styles.checklistItem}>
                          <span className={styles.bullet}>•</span>
                          <p>{detail}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.prayers.length > 0 && (
                    <div className={styles.prayersSection}>
                      <h5>İlgili Dualar:</h5>
                      <div className={styles.prayerBadges}>
                        {step.prayers.map((prayerTitle, index) => (
                          <Link 
                            key={index}
                            href={`/dualar?search=${encodeURIComponent(prayerTitle)}`} 
                            className={styles.prayerBadge}
                          >
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" style={{marginRight: '4px'}}>
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                            {prayerTitle}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
