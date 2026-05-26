'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './aile.module.css';

interface Member {
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export default function FamilyMapPage() {
  // Session states
  const [groupCode, setGroupCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isInGroup, setIsInGroup] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  // Location / Map states
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'tracking' | 'error' | 'denied'>('idle');
  const [locationError, setLocationError] = useState('');

  // Refs for tracking active objects
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [deviceId: string]: any }>({});
  const watchIdRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const leafletModuleRef = useRef<any>(null);

  // Colors list for family members
  const memberColors = ['#0f766e', '#1e3a8a', '#701a75', '#7c2d12', '#14532d', '#b45309'];

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

    // Device ID handling
    let savedDeviceId = localStorage.getItem('umre_family_device_id');
    if (!savedDeviceId) {
      savedDeviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('umre_family_device_id', savedDeviceId);
    }
    setDeviceId(savedDeviceId);

    // Auto-restore group session if present
    const savedGroup = localStorage.getItem('umre_family_group_code');
    const savedName = localStorage.getItem('umre_family_name');
    if (savedGroup && savedName) {
      setGroupCode(savedGroup);
      setUserName(savedName);
      setIsInGroup(true);
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
  }, [isInGroup, deviceId]);

  // Clean up watchers and intervals
  const stopTrackingAndPolling = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setLocationStatus('idle');
  };

  // Start watching location and polling members
  const startTrackingAndPolling = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Tarayıcınız konum servislerini desteklemiyor.');
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

    setLocationStatus('tracking');

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
          setLocationStatus('denied');
          setLocationError('Konum paylaşım izni reddedildi. Haritada görünebilmek için izin vermelisiniz.');
        } else {
          setLocationStatus('error');
          setLocationError('Konum alınamadı: ' + error.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // 3. Initial fetch & Setup polling interval for group members (every 8 seconds)
    fetchGroupMembers();
    pollIntervalRef.current = setInterval(fetchGroupMembers, 8000);
  };

  // Push local location coordinates to DB
  const updateMyLocationOnServer = async (lat: number, lng: number) => {
    if (!groupCode || !deviceId || !userName) return;
    try {
      await fetch('/api/family/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupCode,
          deviceId,
          name: userName,
          latitude: lat,
          longitude: lng,
        }),
      });
    } catch (err) {
      console.warn('Sunucuya konum gönderilemedi:', err);
    }
  };

  // Fetch all coordinates in group
  const fetchGroupMembers = async () => {
    if (!groupCode) return;
    try {
      const res = await fetch(`/api/family/members?groupCode=${encodeURIComponent(groupCode)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMembers(json.data);
          updateMapMarkers(json.data);
        }
      }
    } catch (err) {
      console.warn('Grup üyeleri çekilemedi:', err);
    }
  };

  // Leaflet Marker and Map Sync logic
  const updateMapMarkers = (memberList: Member[]) => {
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
    }

    // B. Draw/Update Markers
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
      const lastSeenText = getRelativeTimeString(m.updatedAt);
      const markerTitle = `${m.name} (${isMe ? 'Ben' : lastSeenText})`;
      
      if (markersRef.current[m.deviceId]) {
        // Update position of existing marker
        markersRef.current[m.deviceId].setLatLng([m.latitude, m.longitude]);
        markersRef.current[m.deviceId].getPopup().setContent(markerTitle);
      } else {
        // Create new marker
        const pinIcon = createMemberMarkerIcon(L, m.name, isMe, idx);
        const marker = L.marker([m.latitude, m.longitude], { icon: pinIcon })
          .addTo(mapRef.current)
          .bindPopup(markerTitle);
          
        markersRef.current[m.deviceId] = marker;
      }
    });
  };

  // Create custom circular avatar pins
  const createMemberMarkerIcon = (L: any, name: string, isMe: boolean, index: number) => {
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
  };

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

    // Call delete API
    try {
      await fetch('/api/family/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCode, deviceId }),
      });
    } catch (e) {
      console.warn(e);
    }

    // Clean up local maps
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
    setIsInGroup(false);
  };

  // Format date helper
  const getRelativeTimeString = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);

      if (diffSec < 15) return 'Şimdi';
      if (diffSec < 60) return `${diffSec}sn önce`;
      if (diffMin < 60) return `${diffMin}dk önce`;
      
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}sa önce`;
      
      return 'İnaktif';
    } catch (e) {
      return 'İnaktif';
    }
  };

  // Check if coordinates have expired (stale if older than 5 minutes for active color)
  const isStale = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      return diffMs > 5 * 60 * 1000; // 5 minutes
    } catch (e) {
      return true;
    }
  };

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
        /* MAP AND TRACKING VIEW */
        <>
          {/* Active Session Info */}
          <div className="card">
            <div className={styles.sessionHeader}>
              <div>
                <span className={styles.label}>Aktif Harita Grubu:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className={styles.groupBadge}>{groupCode}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{userName}</span>
                </div>
              </div>

              <div className={styles.statusIndicator}>
                <span className={`${styles.statusDot} ${locationStatus === 'tracking' ? styles.statusDotActive : ''}`} />
                <span>
                  {locationStatus === 'tracking' && 'Canlı Paylaşım Açık'}
                  {locationStatus === 'denied' && 'Konum İzni Yok'}
                  {locationStatus === 'error' && 'Bağlantı Hatası'}
                  {locationStatus === 'idle' && 'Hazırlanıyor...'}
                </span>
              </div>
            </div>

            {locationStatus === 'denied' && (
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem', color: '#b91c1c' }}>
                {locationError}
              </div>
            )}
          </div>

          {/* Leaflet Map Frame */}
          <div className={styles.mapWrapper}>
            <div id="family-leaflet-map" className={styles.map} />
            
            {/* Map Custom Floating Action Controls */}
            <div className={styles.mapOverlayControls}>
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
                  const inactive = isStale(m.updatedAt);
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
                              <span>Son görülme: {getRelativeTimeString(m.updatedAt)}</span>
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
