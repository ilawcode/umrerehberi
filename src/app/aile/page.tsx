'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { MarkerOptions, LeafletMouseEvent } from 'leaflet';
import styles from './aile.module.css';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  deleteDoc 
} from 'firebase/firestore';

interface Member {
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

const getRelativeTimeString = (dateStr: string, currentNow: number) => {
  if (!currentNow) return 'Hesaplanıyor...';
  try {
    const diffMs = currentNow - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 15) return 'Şimdi';
    if (diffSec < 60) return `${diffSec}sn önce`;
    if (diffMin < 60) return `${diffMin}dk önce`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}sa önce`;
    
    return 'İnaktif';
  } catch {
    return 'İnaktif';
  }
};

const isStale = (dateStr: string, currentNow: number) => {
  if (!currentNow) return false;
  try {
    const diffMs = currentNow - new Date(dateStr).getTime();
    return diffMs > 5 * 60 * 1000; // 5 minutes
  } catch {
    return true;
  }
};

export default function FamilyMapPage() {
  // Session states
  const [groupCode, setGroupCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('umre_family_group_code') || '';
  });
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('umre_family_name') || '';
  });
  const [isInGroup, setIsInGroup] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const savedGroup = localStorage.getItem('umre_family_group_code');
    const savedName = localStorage.getItem('umre_family_name');
    return !!(savedGroup && savedName);
  });
  const [deviceId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    let savedDeviceId = localStorage.getItem('umre_family_device_id');
    if (!savedDeviceId) {
      savedDeviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('umre_family_device_id', savedDeviceId);
    }
    return savedDeviceId;
  });

  // Location / Map states
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'tracking' | 'error' | 'denied'>('idle');
  const [locationError, setLocationError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [now, setNow] = useState<number>(0);

  // Refs for tracking active objects
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<{ [deviceId: string]: import('leaflet').Marker }>({});
  const watchIdRef = useRef<number | null>(null);
  const leafletModuleRef = useRef<typeof import('leaflet') | null>(null);
  const unsubMembersRef = useRef<(() => void) | null>(null);
  const unsubMessagesRef = useRef<(() => void) | null>(null);

  // Chat messaging states
  interface ChatMessage {
    id: string;
    senderName: string;
    deviceId: string;
    text: string;
    createdAt: any;
  }
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickTemplates = [
    'Kabe kapısındayım.',
    'Oteldeyim.',
    'Buluşma noktasındayım.',
    'Yardıma ihtiyacım var!',
    'Tavafı bitirdim.',
    'Sa\'yi bitirdim.'
  ];

  // Colors list for family members
  const memberColors = ['#0f766e', '#1e3a8a', '#701a75', '#7c2d12', '#14532d', '#b45309'];

  // Clean up watchers and listeners
  function stopTrackingAndPolling() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (unsubMembersRef.current) {
      unsubMembersRef.current();
      unsubMembersRef.current = null;
    }
    if (unsubMessagesRef.current) {
      unsubMessagesRef.current();
      unsubMessagesRef.current = null;
    }
    setLocationStatus('idle');
  }

  // Reset and request location permission again
  function handleRetryLocation() {
    stopTrackingAndPolling();
    setTimeout(() => {
      startTrackingAndPolling();
    }, 100);
  }

  // Push local location coordinates to Firestore
  async function updateMyLocationOnServer(lat: number, lng: number) {
    if (!groupCode || !deviceId || !userName) return;
    try {
      const memberRef = doc(db, 'groups', groupCode, 'members', deviceId);
      await setDoc(memberRef, {
        deviceId,
        name: userName,
        latitude: lat,
        longitude: lng,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase\'e konum gönderilemedi:', err);
    }
  }

  // Create custom circular avatar pins
  function createMemberMarkerIcon(L: typeof import('leaflet'), name: string, isMe: boolean, index: number) {
    const initials = name.slice(0, 2).toUpperCase();
    const pinColor = isMe ? '#d97706' : memberColors[index % memberColors.length];

    const html = `
      <div style="
        background-color: ${pinColor};
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${initials}
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${pinColor};
        "></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: '',
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -42],
    });
  }

  // Leaflet Marker and Map Sync logic
  function updateMapMarkers(memberList: Member[]) {
    const L = leafletModuleRef.current;
    if (!L) return;

    // A. Initialize Leaflet Map if it doesn't exist
    if (!mapRef.current) {
      const defaultCenter: [number, number] = [21.4225, 39.8262]; // Mecca Kaaba
      
      // Determine initial center
      let initialCenter = defaultCenter;
      const userLoc = memberList.find(m => m.deviceId === deviceId);
      if (userLoc) {
        initialCenter = [userLoc.latitude, userLoc.longitude];
      } else if (memberList.length > 0) {
        initialCenter = [memberList[0].latitude, memberList[0].longitude];
      }

      mapRef.current = L.map('family-leaflet-map', {
        zoomControl: false,
        attributionControl: false
      }).setView(initialCenter, 16);

      // Add tile layer (OSM)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
      
      // Add custom zoom control at a clean position
      L.control.zoom({ position: 'topleft' }).addTo(mapRef.current);

      // Add map click listener for manual location selection
      mapRef.current.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;

        // Custom Leaflet Popup content styled with CSS module classes
        const popupContent = document.createElement('div');
        popupContent.className = styles.mapPopup;

        const text = document.createElement('p');
        text.innerText = 'Konumunuzu bu harita noktasına güncellemek istiyor musunuz?';
        text.className = styles.mapPopupText;

        const btn = document.createElement('button');
        btn.innerText = 'Konumu Buraya Güncelle';
        btn.className = styles.mapPopupBtn;

        btn.onclick = async () => {
          setMyLocation({ lat, lng });
          try {
            await updateMyLocationOnServer(lat, lng);
          } catch (err) {
            console.warn('Konum güncellenemedi:', err);
          }
          mapRef.current?.closePopup();
        };

        popupContent.appendChild(text);
        popupContent.appendChild(btn);

        if (mapRef.current) {
          L.popup()
            .setLatLng([lat, lng])
            .setContent(popupContent)
            .openOn(mapRef.current);
        }
      });
    }

    // B. Draw/Update Markers
    const map = mapRef.current;
    if (!map) return;

    const currentDeviceIds = new Set(memberList.map(m => m.deviceId));

    // Remove markers of users who are no longer active/expired
    Object.keys(markersRef.current).forEach(id => {
      if (!currentDeviceIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers for active users
    memberList.forEach((m, idx) => {
      const isMe = m.deviceId === deviceId;
      const lastSeenText = getRelativeTimeString(m.updatedAt, now);
      const markerTitle = `${m.name} (${isMe ? 'Ben' : lastSeenText})`;
      
      if (markersRef.current[m.deviceId]) {
        // Update position of existing marker if not currently being dragged by the user
        const existingMarker = markersRef.current[m.deviceId];
        const dragging = existingMarker.dragging as unknown as { isDragging?: () => boolean };
        const isDraggingNow = !!(dragging && typeof dragging.isDragging === 'function' && dragging.isDragging());
        if (!isDraggingNow) {
          existingMarker.setLatLng([m.latitude, m.longitude]);
          existingMarker.getPopup()?.setContent(markerTitle);
        }
      } else {
        // Create new marker (draggable if it is the current user)
        const pinIcon = createMemberMarkerIcon(L, m.name, isMe, idx);
        const markerOptions: { icon: unknown; draggable?: boolean } = { icon: pinIcon };
        if (isMe) {
          markerOptions.draggable = true;
        }

        const marker = L.marker([m.latitude, m.longitude], markerOptions as MarkerOptions)
          .addTo(map)
          .bindPopup(markerTitle);

        if (isMe) {
          marker.on('dragend', async (event: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
            const newLatLng = event.target.getLatLng();
            const confirmUpdate = window.confirm('Konumunuzu bu yeni harita noktasına güncellemek istiyor musunuz?');
            if (confirmUpdate) {
              setMyLocation({ lat: newLatLng.lat, lng: newLatLng.lng });
              try {
                await updateMyLocationOnServer(newLatLng.lat, newLatLng.lng);
              } catch (err) {
                console.warn('Konum güncellenemedi:', err);
              }
            } else {
              // Revert marker to previous position from state
              updateMapMarkers(members);
            }
          });
        }
          
        markersRef.current[m.deviceId] = marker;
      }
    });
  }

  // Subscribe to group member coordinates in Firestore
  function subscribeToGroupMembers() {
    if (!groupCode) return;

    if (unsubMembersRef.current) {
      unsubMembersRef.current();
    }

    const membersRef = collection(db, 'groups', groupCode, 'members');
    unsubMembersRef.current = onSnapshot(membersRef, (snapshot) => {
      const memberList: Member[] = [];
      snapshot.forEach((doc) => {
        memberList.push(doc.data() as Member);
      });
      setMembers(memberList);
      updateMapMarkers(memberList);
    }, (err) => {
      console.warn('Grup üyeleri dinlenemedi:', err);
    });
  }

  // Subscribe to real-time chat messages in Firestore
  function subscribeToMessages() {
    if (!groupCode) return;

    if (unsubMessagesRef.current) {
      unsubMessagesRef.current();
    }

    const messagesRef = collection(db, 'groups', groupCode, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    unsubMessagesRef.current = onSnapshot(q, (snapshot) => {
      const msgList: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgList.push({
          id: doc.id,
          senderName: data.senderName,
          deviceId: data.deviceId,
          text: data.text,
          createdAt: data.createdAt,
        });
      });
      setMessages(msgList);
    }, (err) => {
      console.warn('Mesajlar dinlenemedi:', err);
    });
  }

  // Send a chat message to Firestore
  async function handleSendMessage(e?: React.FormEvent, customText?: string) {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : messageText;
    if (!textToSend.trim() || !groupCode || !deviceId || !userName) return;

    try {
      const messagesRef = collection(db, 'groups', groupCode, 'messages');
      await addDoc(messagesRef, {
        senderName: userName,
        deviceId,
        text: textToSend.trim(),
        createdAt: serverTimestamp(),
      });
      if (customText === undefined) {
        setMessageText('');
      }
    } catch (err) {
      console.warn('Mesaj gönderilemedi:', err);
    }
  }

  // Manual update triggers getCurrentPosition once and updates Firestore
  async function handleManualUpdate() {
    if (!isInGroup) return;
    setIsUpdating(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMyLocation({ lat: latitude, lng: longitude });
          try {
            await updateMyLocationOnServer(latitude, longitude);
          } catch (err) {
            console.warn('Konum güncellenemedi:', err);
          } finally {
            setIsUpdating(false);
          }
        },
        async (error) => {
          console.error('Geolocation manual fetch error:', error);
          setIsUpdating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        }
      );
    } else {
      setIsUpdating(false);
    }
  }

  // Start watching location and set up Firestore real-time listeners
  async function startTrackingAndPolling() {
    if (!navigator.geolocation) {
      setTimeout(() => {
        setLocationStatus('error');
        setLocationError('Tarayıcınız konum servislerini desteklemiyor.');
      }, 0);
      return;
    }

    // 1. Dynamically import Leaflet on client side
    try {
      if (!leafletModuleRef.current) {
        leafletModuleRef.current = await import('leaflet');
      }
    } catch (err) {
      console.error('Leaflet load failed:', err);
    }

    setTimeout(() => {
      setLocationStatus('tracking');
    }, 0);

    // 2. Start watching geolocation
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });
        updateMyLocationOnServer(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setTimeout(() => {
            setLocationStatus('denied');
            setLocationError('Konum paylaşım izni reddedildi. Haritada görünebilmek için izin vermelisiniz.');
          }, 0);
        } else {
          setTimeout(() => {
            setLocationStatus('error');
            setLocationError('Konum alınamadı: ' + error.message);
          }, 0);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // 3. Start Firestore real-time listeners for members and chat messages
    subscribeToGroupMembers();
    subscribeToMessages();
  }

  // Initialize now state on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Initialize: Load/Create unique Device ID and check existing session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS dynamically to prevent build failures or layout issues
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    return () => {
      stopTrackingAndPolling();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle tracking and polling when in group
  useEffect(() => {
    if (isInGroup && deviceId) {
      startTrackingAndPolling();
    } else {
      stopTrackingAndPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInGroup, deviceId]);

  // Center map on a single member
  const centerOnMember = (lat: number, lng: number, name: string) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 17);
      // Find the marker and open its popup if it exists
      const marker = markersRef.current[members.find(m => m.name === name)?.deviceId || ''];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Center map to fit all active markers
  const fitAllMembers = () => {
    const L = leafletModuleRef.current;
    if (!mapRef.current || !L || members.length === 0) return;

    const bounds = L.latLngBounds(members.map(m => [m.latitude, m.longitude]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  // Center on current user
  const centerOnMe = () => {
    const me = members.find(m => m.deviceId === deviceId);
    if (me) {
      centerOnMember(me.latitude, me.longitude, me.name);
    } else if (myLocation) {
      if (mapRef.current) mapRef.current.setView([myLocation.lat, myLocation.lng], 17);
    }
  };

  // Handle Form submit: Join/Create group
  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim() || !userName.trim()) return;

    const cleanGroup = groupCode.toUpperCase().trim();
    const cleanName = userName.trim();

    setGroupCode(cleanGroup);
    setUserName(cleanName);
    setIsInGroup(true);

    localStorage.setItem('umre_family_group_code', cleanGroup);
    localStorage.setItem('umre_family_name', cleanName);
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!confirm('Gruptan ayrılmak ve konum paylaşımını durdurmak istediğinize emin misiniz?')) return;

    // Remove local user from Firestore members
    try {
      const memberRef = doc(db, 'groups', groupCode, 'members', deviceId);
      await deleteDoc(memberRef);
    } catch (err) {
      console.warn('Firebase\'den çıkış yapılamadı:', err);
    }

    // Also try API call for fallback/logging
    try {
      await fetch('/api/family/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCode, deviceId }),
      });
    } catch (e) {
      // Silently ignore API failure
    }

    // Clean up local maps and listeners
    stopTrackingAndPolling();
    Object.keys(markersRef.current).forEach(id => {
      markersRef.current[id].remove();
    });
    markersRef.current = {};
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    localStorage.removeItem('umre_family_group_code');
    localStorage.removeItem('umre_family_name');
    
    setMyLocation(null);
    setMembers([]);
    setMessages([]);
    setIsInGroup(false);
  };

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Format date helper and stale check functions moved outside the component for purity

  return (
    <div className={styles.container}>
      {/* Header Info */}
      <div className={`${styles.headerCard} card`}>
        <h3 className={styles.pageTitle}>Aile Takip Haritası</h3>
        <p className={styles.helperText}>
          Umre ibadetiniz sırasında kalabalık alanlarda birbirinizi kaybetmemek için aile üyelerinizle konumunuzu canlı olarak paylaşabilirsiniz.
        </p>
      </div>

      {!isInGroup ? (
        /* JOIN / CREATE GROUP VIEW */
        <form onSubmit={handleJoinGroup} className={`${styles.formCard} card`}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="group-code-input">Aile / Grup Kodu</label>
            <input
              id="group-code-input"
              type="text"
              placeholder="Örn: BIZIM-AILE veya MEKKE2026"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              className={styles.input}
              maxLength={20}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Ailenizle aynı kodu girerek aynı harita grubuna dahil olabilirsiniz.
            </span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username-input">Adınız (Haritada Görünecek İsim)</label>
            <input
              id="username-input"
              type="text"
              placeholder="Örn: Uğur, Annem, Eşim, Babam"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={styles.input}
              maxLength={15}
              required
            />
          </div>

          <button id="join-group-btn" type="submit" className="btn-primary styles.submitBtn">
            Gruba Katıl / Haritayı Aç
          </button>
        </form>
      ) : (
        <>
          {/* Active Session Info */}
          <div className="card">
            <div className={styles.sessionHeader}>
              <div className={styles.groupInfo}>
                <span className={styles.label}>Aktif Harita Grubu:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className={styles.groupBadge}>{groupCode}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{userName}</span>
                </div>
              </div>

              <div className={styles.sessionActions}>
                <button
                  type="button"
                  onClick={handleManualUpdate}
                  className={`${styles.updateBtn} ${isUpdating ? styles.updating : ''}`}
                  disabled={isUpdating}
                  title="Konumları Güncelle"
                >
                  <svg className={`${styles.refreshIcon} ${isUpdating ? styles.spin : ''}`} viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>{isUpdating ? 'Güncelleniyor...' : 'Konumları Güncelle'}</span>
                </button>

                <div 
                  className={`${styles.statusIndicator} ${
                    locationStatus === 'denied' || locationStatus === 'error' ? styles.statusIndicatorClickable : ''
                  }`}
                  onClick={locationStatus === 'denied' || locationStatus === 'error' ? handleRetryLocation : undefined}
                  title={locationStatus === 'denied' || locationStatus === 'error' ? 'Yeniden denemek için tıklayın' : undefined}
                >
                  <span className={`${styles.statusDot} ${
                    locationStatus === 'tracking' ? styles.statusDotActive : ''
                  } ${
                    locationStatus === 'denied' || locationStatus === 'error' ? styles.statusDotError : ''
                  }`} />
                  <span>
                    {locationStatus === 'tracking' && 'Canlı Paylaşım Açık'}
                    {locationStatus === 'denied' && 'Konum İzni Yok (Tıkla)'}
                    {locationStatus === 'error' && 'Bağlantı Hatası (Tıkla)'}
                    {locationStatus === 'idle' && 'Hazırlanıyor...'}
                  </span>
                </div>
              </div>
            </div>

            {locationStatus === 'denied' && (
              <button 
                onClick={handleRetryLocation} 
                className={styles.retryBanner}
                title="Konum iznini yeniden istemek için tıklayın"
                type="button"
              >
                <span className={styles.retryIcon}>⚠️</span>
                <div className={styles.retryTextContainer}>
                  <strong className={styles.retryTitle}>Konum İzni Yok - Yeniden İste</strong>
                  <span className={styles.retryMessage}>{locationError} Yeniden denemek için tıklayın.</span>
                </div>
              </button>
            )}

            {locationStatus === 'error' && (
              <button 
                onClick={handleRetryLocation} 
                className={styles.retryBanner}
                title="Yeniden denemek için tıklayın"
                type="button"
              >
                <span className={styles.retryIcon}>⚠️</span>
                <div className={styles.retryTextContainer}>
                  <strong className={styles.retryTitle}>Hata Oluştu - Yeniden Dene</strong>
                  <span className={styles.retryMessage}>{locationError} Yeniden denemek için tıklayın.</span>
                </div>
              </button>
            )}
          </div>

          {/* Leaflet Map Frame */}
          <div className={styles.mapWrapper}>
            <div id="family-leaflet-map" className={styles.map} />
            
            {/* Map Custom Floating Action Controls */}
            <div className={styles.mapOverlayControls}>
              <button 
                onClick={handleManualUpdate} 
                className={`${styles.controlBtn} ${isUpdating ? styles.updatingBtn : ''}`}
                disabled={isUpdating}
                title="Konumları Güncelle"
                aria-label="Konumları harita üzerinden güncelle"
              >
                <svg className={`${styles.refreshIcon} ${isUpdating ? styles.spin : ''}`} viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" strokeWidth="2.5" fill="none">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </button>

              <button 
                onClick={centerOnMe} 
                className={styles.controlBtn} 
                title="Beni Ortala"
                aria-label="Konumumu haritada ortala"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" strokeWidth="2.5" fill="none">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
              </button>
              
              <button 
                onClick={fitAllMembers} 
                className={styles.controlBtn} 
                title="Herkesi Göster"
                aria-label="Tüm aile üyelerini haritada göster"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" strokeWidth="2.5" fill="none">
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className={styles.membersSection}>
            <h4 className={styles.sectionTitle}>Haritadaki Aile Üyeleri ({members.length})</h4>
            
            <div className={styles.membersList}>
              {members.length > 0 ? (
                members.map((m, idx) => {
                  const isMe = m.deviceId === deviceId;
                  const inactive = isStale(m.updatedAt, now);
                  const color = isMe ? '#d97706' : memberColors[idx % memberColors.length];
                  
                  return (
                    <div key={m.deviceId} className={`${styles.memberItem} card`}>
                      <div className={styles.memberInfo}>
                        <div 
                          className={styles.memberAvatar} 
                          style={{ 
                            backgroundColor: inactive && !isMe ? '#94a3b8' : color,
                            border: isMe ? '2px solid #b45309' : 'none'
                          }}
                        >
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className={styles.memberName}>
                            {m.name} {isMe && <span style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>(Siz)</span>}
                          </span>
                          <div className={styles.memberTime}>
                            {inactive && !isMe ? (
                              <span style={{ color: '#ef4444' }}>Bağlantı Kesildi (İnaktif)</span>
                            ) : (
                              <span>Son görülme: {getRelativeTimeString(m.updatedAt, now)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.memberActions}>
                        <button 
                          onClick={() => centerOnMember(m.latitude, m.longitude, m.name)}
                          className={`${styles.actionBtn} btn-secondary`}
                          aria-label={`${m.name} adlı üyeye odaklan`}
                        >
                          Bul
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                  Grupta henüz kimse yok. Ailenize grup kodunu gönderin.
                </div>
              )}
            </div>
          </div>

          {/* Real-time Group Chat */}
          <div className="card">
            <div className={styles.chatSection}>
              <div className={styles.chatHeader}>
                <h4 className={styles.chatTitle}>
                  <svg className={styles.chatTitleIcon} viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Grup Sohbeti
                </h4>
              </div>

              <div className={styles.chatMessages}>
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMe = msg.deviceId === deviceId;
                    const timeString = msg.createdAt && msg.createdAt.seconds
                      ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div key={msg.id} className={`${styles.messageRow} ${isMe ? styles.messageRowMe : styles.messageRowOther}`}>
                        <div className={`${styles.messageBubble} ${isMe ? styles.messageBubbleMe : styles.messageBubbleOther}`}>
                          {!isMe && <span className={`${styles.messageSender} ${styles.messageSenderOther}`}>{msg.senderName}</span>}
                          <span className={styles.messageText}>{msg.text}</span>
                          <span className={styles.messageTime}>{timeString}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyChat}>
                    Henüz mesaj yok. Grubunuza ilk mesajı siz gönderin!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Template Chips */}
              <div className={styles.quickTemplates}>
                {quickTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => handleSendMessage(e, tpl)}
                    className={styles.quickTemplateChip}
                  >
                    {tpl}
                  </button>
                ))}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={(e) => handleSendMessage(e)} className={styles.chatForm}>
                <input
                  type="text"
                  placeholder="Mesajınızı yazın..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className={styles.chatInput}
                  maxLength={200}
                />
                <button type="submit" className={styles.chatSendBtn} disabled={!messageText.trim()}>
                  Gönder
                </button>
              </form>
            </div>
          </div>

          {/* Exit Button */}
          <button onClick={handleLeaveGroup} className={`${styles.leaveBtn} btn-secondary`}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Paylaşımı Durdur ve Ayrıl
          </button>
        </>
      )}
    </div>
  );
}
