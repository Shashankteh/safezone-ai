import React, { useEffect, useState } from 'react';
import LiveMap from '../components/Map/LiveMap';
import { useSafety } from '../context/SafetyContext';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { myLocation, isSharing, startTracking, stopTracking, trustedLocations, sosActive } = useSafety();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isOnline = isSharing || !!myLocation;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050d14', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', flexShrink: 0, zIndex: 20,
        background: 'rgba(5,13,20,0.95)', borderBottom: '1px solid rgba(0,255,136,0.1)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🛡️</span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', color: 'white', letterSpacing: '2px' }}>SAFEZONE</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {sosActive && (
            <span style={{
              background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.5)',
              borderRadius: '4px', padding: '3px 8px', color: '#ff3366',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
            }}>🚨 SOS</span>
          )}
          <span style={{
            background: isOnline ? 'rgba(0,255,136,0.1)' : 'rgba(255,170,0,0.1)',
            border: `1px solid ${isOnline ? 'rgba(0,255,136,0.4)' : 'rgba(255,170,0,0.4)'}`,
            borderRadius: '4px', padding: '3px 10px',
            color: isOnline ? '#00ff88' : '#ffaa00',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
          }}>
            {isOnline ? '● ONLINE' : '○ OFFLINE'}
          </span>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <LiveMap />
        </div>

        {/* GPS + contacts — top RIGHT only */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{
            background: 'rgba(5,13,20,0.9)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
            padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
          }}>
            <span>{myLocation ? '🟢' : '🟡'}</span>
            <span style={{ color: myLocation ? '#00ff88' : '#ffaa00' }}>
              {myLocation ? 'GPS OK' : 'Locating...'}
            </span>
          </div>
          <div style={{
            background: 'rgba(5,13,20,0.9)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
            padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.5)',
          }}>
            👥 {trustedLocations.length} contacts
          </div>
        </div>

        {/* Share location toggle */}
        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <button onClick={isSharing ? stopTracking : startTracking} style={{
            padding: '10px 28px', borderRadius: '24px', cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: isSharing ? 'rgba(255,51,102,0.12)' : 'rgba(0,255,136,0.12)',
            border: `1px solid ${isSharing ? 'rgba(255,51,102,0.5)' : 'rgba(0,255,136,0.5)'}`,
            color: isSharing ? '#ff3366' : '#00ff88',
            boxShadow: `0 0 20px ${isSharing ? 'rgba(255,51,102,0.15)' : 'rgba(0,255,136,0.15)'}`,
            transition: 'all 0.2s', backdropFilter: 'blur(8px)',
          }}>
            {isSharing ? '⏹ Stop Sharing' : '📡 Share Location'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        borderTop: '1px solid rgba(0,255,136,0.08)',
        background: 'rgba(5,13,20,0.97)',
      }}>
        {[
          { label: 'SAFETY', value: myLocation ? '72' : '--', unit: '/100', color: '#00ff88' },
          { label: 'CONTACTS', value: String(trustedLocations.length), unit: ' near', color: '#00c8ff' },
          { label: 'STATUS', value: sosActive ? 'SOS' : 'OK', unit: '', color: sosActive ? '#ff3366' : '#00ff88' },
        ].map(({ label, value, unit, color }, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px',
            borderRight: i < 2 ? '1px solid rgba(0,255,136,0.08)' : 'none',
          }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '15px', fontWeight: 700, color }}>
              {value}<span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{unit}</span>
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
