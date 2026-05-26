'use client';

import React, { useState, useEffect } from 'react';
import styles from './notlar.module.css';

interface Note {
  _id?: string; // MongoDB id
  localId?: string; // fallback localstorage id
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadNotes();
  }, []);

  // Fetch all notes (check MongoDB, fallback to LocalStorage)
  async function loadNotes() {
    try {
      setLoading(true);
      const res = await fetch('/api/notes');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotes(json.data);
          setIsOfflineMode(false);
          // Sync localstorage for backup
          localStorage.setItem('umre_notes_backup', JSON.stringify(json.data));
          return;
        }
      }
      throw new Error('API connection failed');
    } catch (e) {
      console.warn('API error, switching to offline local mode:', e);
      setIsOfflineMode(true);
      const localData = localStorage.getItem('umre_notes_backup');
      if (localData) {
        try {
          setNotes(JSON.parse(localData));
        } catch (err) {
          console.error(err);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Create new note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newNoteText = inputText.trim();
    setInputText('');

    if (!isOfflineMode) {
      try {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newNoteText }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const updated = [json.data, ...notes];
            setNotes(updated);
            localStorage.setItem('umre_notes_backup', JSON.stringify(updated));
            return;
          }
        }
      } catch (e) {
        console.error('Failed to save to server, falling back to local:', e);
      }
    }

    // Offline / Local fallback mode
    const localNote: Note = {
      localId: Math.random().toString(36).substr(2, 9),
      text: newNoteText,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updatedLocal = [localNote, ...notes];
    setNotes(updatedLocal);
    localStorage.setItem('umre_notes_backup', JSON.stringify(updatedLocal));
    setIsOfflineMode(true);
  };

  // Toggle note completion
  const handleToggleComplete = async (note: Note) => {
    const nextCompletedState = !note.completed;

    // Optimistic UI update
    const updatedNotes = notes.map(n => {
      const match = note._id ? n._id === note._id : n.localId === note.localId;
      return match ? { ...n, completed: nextCompletedState } : n;
    });
    setNotes(updatedNotes);
    localStorage.setItem('umre_notes_backup', JSON.stringify(updatedNotes));

    if (!isOfflineMode && note._id) {
      try {
        const res = await fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: note._id, completed: nextCompletedState }),
        });
        if (!res.ok) {
          throw new Error('API failed');
        }
      } catch (e) {
        console.warn('Failed to sync toggle to server, keeping local update:', e);
        setIsOfflineMode(true);
      }
    }
  };

  // Delete note
  const handleDeleteNote = async (note: Note) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

    // Optimistic UI update
    const updatedNotes = notes.filter(n => {
      return note._id ? n._id !== note._id : n.localId !== note.localId;
    });
    setNotes(updatedNotes);
    localStorage.setItem('umre_notes_backup', JSON.stringify(updatedNotes));

    if (!isOfflineMode && note._id) {
      try {
        const res = await fetch(`/api/notes?id=${note._id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('API failed');
        }
      } catch (e) {
        console.warn('Failed to delete on server, keeping local delete:', e);
        setIsOfflineMode(true);
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={`${styles.headerCard} card`}>
        <div className={styles.headerInfo}>
          <h3 className={styles.pageTitle}>Dua İstekleri ve Notlarım</h3>
          
          {/* Status Badge */}
          <span className={`${styles.statusBadge} ${isOfflineMode ? styles.offline : styles.online}`}>
            {isOfflineMode ? (
              <>
                <span className={styles.statusDot} />
                Çevrimdışı (Cihaza Kayıtlı)
              </>
            ) : (
              <>
                <span className={styles.statusDot} />
                Çevrimiçi (Buluta Kayıtlı)
              </>
            )}
          </span>
        </div>
        <p className={styles.helperText}>
          Eş, dost ve akrabalarınızın Kabe'de yapılmasını istediği duaları buraya kaydedebilir, dua ettikçe tamamlandı olarak işaretleyebilirsiniz.
        </p>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className={`${styles.form} card`}>
        <input
          id="new-note-input"
          type="text"
          placeholder="Yeni dua talebi veya not yazın..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={styles.input}
          maxLength={150}
        />
        <button id="add-note-submit-btn" type="submit" className={styles.addBtn}>
          Ekle
        </button>
      </form>

      {/* Notes List */}
      <div className={styles.notesList}>
        {loading ? (
          <div className={styles.loadingState}>Notlar yükleniyor...</div>
        ) : notes.length > 0 ? (
          notes.map((note, index) => {
            const uniqueKey = note._id || note.localId || index;
            return (
              <div 
                key={uniqueKey} 
                className={`${styles.noteItem} ${note.completed ? styles.noteCompleted : ''} card`}
              >
                <button
                  id={`toggle-note-${uniqueKey}`}
                  type="button"
                  onClick={() => handleToggleComplete(note)}
                  className={`${styles.checkbox} ${note.completed ? styles.checked : ''}`}
                  aria-label="Not durumunu değiştir"
                >
                  {note.completed && (
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <p className={styles.noteText}>{note.text}</p>

                <button
                  id={`delete-note-${uniqueKey}`}
                  type="button"
                  onClick={() => handleDeleteNote(note)}
                  className={styles.deleteBtn}
                  aria-label="Notu sil"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            Henüz not eklenmemiş. Sevdiklerinizden gelen dua taleplerini buraya yazarak başlayabilirsiniz.
          </div>
        )}
      </div>
    </div>
  );
}
