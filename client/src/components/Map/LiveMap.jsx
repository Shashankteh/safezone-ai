import React, { useRef, useEffect, useState } from 'react';
import { useSafety } from '../../context/SafetyContext';

const LiveMap = () => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const myMarker = useRef(null);
  const contactMarkers = useRef([]);
  const { myLocation, trustedLocations, nearbyAlerts } = useSafety();
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return;
    const L = window.L;
    if (!L) return;

    leafletMap.current = L.map(mapRef.current, {
      center: [26.9124, 75.7873],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(leafletMap.current);

    // Zoom controls bottom-right, above nav bar
    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

    setMapReady(true);
    return () => { leafletMap.current?.remove(); leafletMap.current = null; };
  }, []);

  // Auto-geolocate on load
  useEffect(() => {
    if (!mapReady) return;
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        leafletMap.current?.setView([lat, lng], 15, { animate: true });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mapReady]);

  // "You" marker
  useEffect(() => {
    if (!mapReady || !myLocation) return;
    const L = window.L;
    const { lat, lng } = myLocation;
    const icon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:40px;height:40px;border-radius:50%;border:2px solid rgba(0,255,136,0.4);top:-8px;left:-8px;animation:sz-ping 2s ease-in-out infinite;"></div>
        <div style="width:18px;height:18px;background:#00ff88;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(0,255,136,0.9);"></div>
      </div>`,
      iconSize: [24, 24], iconAnchor: [12, 12],
    });
    if (myMarker.current) {
      myMarker.current.setLatLng([lat, lng]);
    } else {
      myMarker.current = L.marker([lat, lng], { icon })
        .bindPopup(`<b style="color:#00ff88">📍 You</b><br/><small>${lat.toFixed(5)}, ${lng.toFixed(5)}</small>`)
        .addTo(leafletMap.current);
      leafletMap.current.setView([lat, lng], 15, { animate: true });
    }
  }, [myLocation, mapReady]);

  // Contact markers
  useEffect(() => {
    if (!mapReady) return;
    const L = window.L;
    contactMarkers.current.forEach(m => m.remove());
    contactMarkers.current = [];
    trustedLocations.forEach((c, i) => {
      const col = ['#00c8ff','#a855f7','#f59e0b','#ec4899'][i % 4];
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:${col};border-radius:50%;border:2px solid white;box-shadow:0 0 8px ${col}99"></div>`,
        iconSize: [14,14], iconAnchor: [7,7],
      });
      contactMarkers.current.push(
        L.marker([c.lat, c.lng], { icon }).bindPopup(`👤 ${c.name || 'Contact'}`).addTo(leafletMap.current)
      );
    });
  }, [trustedLocations, mapReady]);

  const centerOnMe = () => {
    if (myLocation) {
      leafletMap.current?.setView([myLocation.lat, myLocation.lng], 16, { animate: true });
    } else {
      setLocating(true);
      navigator.geolocation?.getCurrentPosition(
        (pos) => { leafletMap.current?.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true }); setLocating(false); },
        () => setLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* LIVE MAP badge — top left, small */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px', zIndex: 1000,
        background: 'rgba(5,13,20,0.92)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px',
        padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '7px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', pointerEvents: 'none',
      }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', display: 'inline-block', animation: 'sz-blink 2s infinite' }} />
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>LIVE MAP</span>
      </div>

      {/* Center on me — bottom left above nav */}
      <button onClick={centerOnMe} style={{
        position: 'absolute', bottom: '90px', left: '12px', zIndex: 1000,
        background: 'rgba(5,13,20,0.92)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,200,255,0.3)', borderRadius: '8px',
        padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#00c8ff',
      }}>
        {locating ? '⏳' : '🎯'} {locating ? 'Finding...' : 'Center Me'}
      </button>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: '140px', left: '12px', zIndex: 1000,
        background: 'rgba(5,13,20,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px',
        padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>You</span>
        </div>
        {trustedLocations.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '5px' }}>
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#00c8ff' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Contacts ({trustedLocations.length})</span>
          </div>
        )}
        {nearbyAlerts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '5px' }}>
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff3366' }} />
            <span style={{ color: '#ff3366' }}>Alerts ({nearbyAlerts.length})</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sz-ping { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.4);opacity:.1} }
        @keyframes sz-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        .leaflet-bottom.leaflet-right { bottom: 90px !important; }
        .leaflet-control-zoom a {
          background: rgba(5,13,20,0.9) !important;
          color: white !important;
          border-color: rgba(0,255,136,0.2) !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover { background: rgba(0,255,136,0.1) !important; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution { font-size: 9px; opacity: 0.4; }
      `}</style>
    </div>
  );
};

export default LiveMap;
