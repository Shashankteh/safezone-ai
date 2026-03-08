import React, { useEffect, useState, useCallback } from 'react';
import LiveMap from '../components/Map/LiveMap';
import BottomNav from '../components/Layout/BottomNav';
import { useSafety } from '../context/SafetyContext';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { myLocation, isSharing, startTracking, stopTracking, sosActive } = useSafety();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleTrackingToggle = useCallback(() => {
    if (isSharing) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isSharing, startTracking, stopTracking]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050d14', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'rgba(10,22,40,0.95)',
        borderBottom: '1px solid rgba(0,255,136,0.12)', zIndex: 20, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00ff88', fontSize: 14, letterSpacing: 2 }}>SAFEZONE</span>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {sosActive && (
            <span style={{
              fontSize: 10, fontFamily: 'monospace', padding: '2px 8px',
              background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.4)',
              color: '#ff3366', borderRadius: 2, animation: 'pulse 1s infinite'
            }}>🚨 SOS</span>
          )}
          <span style={{
            fontSize: 10, fontFamily: 'monospace', padding: '2px 8px',
            background: isSharing ? 'rgba(0,255,136,0.1)' : 'rgba(255,170,0,0.1)',
            border: `1px solid ${isSharing ? 'rgba(0,255,136,0.3)' : 'rgba(255,170,0,0.3)'}`,
            color: isSharing ? '#00ff88' : '#ffaa00', borderRadius: 2
          }}>
            {isSharing ? '● LIVE' : '○ OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── Map Area ────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <LiveMap style={{ position: 'absolute', inset: 0 }} />

        {/* Share Location Button — bottom center above nav */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
        }}>
          <button
            onClick={handleTrackingToggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', fontFamily: 'monospace', fontSize: 13,
              fontWeight: 600, letterSpacing: 1, cursor: 'pointer',
              border: isSharing
                ? '1px solid rgba(255,51,102,0.6)'
                : '1px solid rgba(0,255,136,0.5)',
              background: isSharing
                ? 'rgba(255,51,102,0.15)'
                : 'rgba(0,255,136,0.12)',
              color: isSharing ? '#ff3366' : '#00ff88',
              borderRadius: 4,
              boxShadow: isSharing
                ? '0 0 20px rgba(255,51,102,0.3)'
                : '0 0 20px rgba(0,255,136,0.2)',
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: 16 }}>{isSharing ? '⏹' : '📡'}</span>
            {isSharing ? 'Stop Sharing' : 'Share Location'}
          </button>

          {/* GPS coords */}
          {myLocation && (
            <div style={{
              fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)',
              background: 'rgba(0,0,0,0.5)', padding: '3px 10px', borderRadius: 2,
              backdropFilter: 'blur(4px)'
            }}>
              📍 {myLocation.lat?.toFixed(4)}, {myLocation.lng?.toFixed(4)}
            </div>
          )}
        </div>

        {/* Status badges — top right */}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 25,
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <div style={{
            background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(0,255,136,0.2)',
            padding: '6px 10px', borderRadius: 4, backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: myLocation ? '#00ff88' : '#ffaa00',
              boxShadow: myLocation ? '0 0 6px #00ff88' : '0 0 6px #ffaa00'
            }} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {myLocation ? 'GPS OK' : 'Locating...'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        borderTop: '1px solid rgba(0,255,136,0.08)', background: 'rgba(10,22,40,0.95)'
      }}>
        {[
          { label: 'GPS', value: myLocation ? '●' : '○', color: myLocation ? '#00ff88' : '#ffaa00' },
          { label: 'SHARING', value: isSharing ? 'ON' : 'OFF', color: isSharing ? '#00ff88' : '#ffaa00' },
          { label: 'STATUS', value: sosActive ? 'SOS' : 'SAFE', color: sosActive ? '#ff3366' : '#00ff88' },
        ].map((stat, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0', borderRight: i < 2 ? '1px solid rgba(0,255,136,0.08)' : 'none'
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
