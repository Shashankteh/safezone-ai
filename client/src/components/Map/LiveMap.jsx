import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LiveMap = ({ className = '' }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [locError, setLocError] = useState(null);

  // Online/offline detection
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    mapRef.current = L.map(mapContainer.current, {
      center: [26.9124, 75.7873],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© SafeZone AI',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Get location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        setLocError(null);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const youIcon = L.divIcon({
              className: '',
              html: `<div style="
                width:18px;height:18px;
                background:#00f5ff;
                border:3px solid #fff;
                border-radius:50%;
                box-shadow:0 0 12px #00f5ff,0 0 24px #00f5ff88;
                animation:pulse 2s infinite;
              "></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            });
            markerRef.current = L.marker([lat, lng], { icon: youIcon })
              .addTo(mapRef.current)
              .bindPopup('📍 You are here');
          }
        }
      },
      (err) => setLocError('Allow location access for full features'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const centerMap = () => {
    if (mapRef.current && location) {
      mapRef.current.setView([location.lat, location.lng], 15);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0a0f' }}>
      {/* Map */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* LIVE Badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        background: 'rgba(0,245,255,0.15)', border: '1px solid #00f5ff',
        borderRadius: 20, padding: '4px 12px', color: '#00f5ff',
        fontSize: 12, fontWeight: 700, letterSpacing: 2,
        backdropFilter: 'blur(8px)',
      }}>
        🟢 LIVE MAP
      </div>

      {/* Online/Offline */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        background: online ? 'rgba(0,255,136,0.15)' : 'rgba(255,50,50,0.15)',
        border: `1px solid ${online ? '#00ff88' : '#ff3232'}`,
        borderRadius: 20, padding: '4px 12px',
        color: online ? '#00ff88' : '#ff3232',
        fontSize: 11, fontWeight: 600,
        backdropFilter: 'blur(8px)',
      }}>
        {online ? '● ONLINE' : '○ OFFLINE'}
      </div>

      {/* Location error */}
      {locError && (
        <div style={{
          position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(255,165,0,0.2)', border: '1px solid orange',
          borderRadius: 8, padding: '6px 14px', color: 'orange', fontSize: 12,
          backdropFilter: 'blur(8px)', textAlign: 'center',
        }}>
          ⚠️ {locError}
        </div>
      )}

      {/* Center Me button */}
      <button onClick={centerMap} style={{
        position: 'absolute', bottom: 90, left: 12, zIndex: 1000,
        background: 'rgba(0,245,255,0.15)', border: '1px solid #00f5ff',
        borderRadius: 20, padding: '6px 14px', color: '#00f5ff',
        fontSize: 12, cursor: 'pointer', backdropFilter: 'blur(8px)',
      }}>
        🎯 Center Me
      </button>

      <style>{`
        @keyframes pulse {
          0%,100% { transform: scale(1); opacity:1; }
          50% { transform: scale(1.4); opacity:0.7; }
        }
        .leaflet-container { background: #0a0a0f !important; }
      `}</style>
    </div>
  );
};

export default LiveMap;
