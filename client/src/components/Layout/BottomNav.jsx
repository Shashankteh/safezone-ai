import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const tabs = [
    { path: '/dashboard', icon: '🗺️', label: 'Map' },
    { path: '/contacts',  icon: '👥', label: 'Contacts' },
    { path: '/sos',       icon: '🆘', label: 'SOS', isSOS: true },
    { path: '/safety',    icon: '🛡️', label: 'Safety' },
    { path: '/incidents', icon: '🏠', label: 'Home' },
  ];

  // Replace last tab for admin
  if (user?.role === 'admin') {
    tabs[4] = { path: '/admin', icon: '⚙️', label: 'Admin' };
  }

  return (
    <>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(5,13,20,0.98)',
        borderTop: '1px solid rgba(0,255,136,0.08)',
        display: 'flex', zIndex: 1000, height: '64px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.6)',
      }}>
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: tab.isSOS ? 'flex-end' : 'center',
                gap: '3px', background: 'none', border: 'none',
                cursor: 'pointer', padding: tab.isSOS ? '0 0 6px' : '8px 0 6px',
                position: 'relative', outline: 'none',
              }}>

              {/* Active top bar */}
              {isActive && !tab.isSOS && (
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%',
                  height: '2px', background: '#00ff88', borderRadius: '0 0 3px 3px',
                  boxShadow: '0 0 8px #00ff88',
                }} />
              )}

              {tab.isSOS ? (
                // Floating SOS button
                <div style={{
                  width: '54px', height: '54px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff3366, #cc0033)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '6px',
                  boxShadow: '0 0 20px rgba(255,51,102,0.7), 0 -4px 16px rgba(255,51,102,0.3)',
                  border: '3px solid rgba(5,13,20,0.98)',
                  position: 'relative', top: '-16px',
                  transition: 'transform 0.15s ease',
                }}>
                  {tab.icon}
                </div>
              ) : (
                <span style={{
                  fontSize: '20px', lineHeight: 1,
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(0,255,136,0.9))' : 'none',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  display: 'block',
                }}>{tab.icon}</span>
              )}

              <span style={{
                fontSize: '9px',
                color: isActive && !tab.isSOS ? '#00ff88' : 'rgba(255,255,255,0.3)',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.04em',
                transition: 'color 0.2s',
                marginTop: tab.isSOS ? '-6px' : '0',
              }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      {/* Spacer so content doesn't hide behind nav */}
      <div style={{ height: '64px' }} />
    </>
  );
};

export default BottomNav;
