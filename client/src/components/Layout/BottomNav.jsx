import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/',          icon: '🏠', label: 'HOME'     },
  { path: '/dashboard', icon: '📊', label: 'DASH'     },
  { path: '/sos',       icon: '🆘', label: 'SOS'      },
  { path: '/contacts',  icon: '👥', label: 'CONTACTS' },
  { path: '/safety',    icon: '🛡️', label: 'SAFETY'   },
];

const BottomNav = () => {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(5,13,20,0.97)',
      borderTop: '1px solid rgba(0,255,136,0.15)',
      display: 'flex',
      alignItems: 'stretch',
      height: 64,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      {navItems.map(item => {
        const active = pathname === item.path ||
          (item.path !== '/' && pathname.startsWith(item.path));

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 2px',
              position: 'relative',
              transition: 'all 0.15s',
            }}
          >
            {/* Active indicator bar */}
            {active && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 2,
                background: '#00ff88',
                borderRadius: '0 0 3px 3px',
                boxShadow: '0 0 8px rgba(0,255,136,0.6)',
              }} />
            )}

            <span style={{
              fontSize: item.label === 'SOS' ? 22 : 18,
              lineHeight: 1,
              filter: active ? 'drop-shadow(0 0 6px rgba(0,255,136,0.8))' : 'none',
              transform: active ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.15s',
            }}>
              {item.icon}
            </span>

            <span style={{
              fontFamily: 'monospace',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              color: active ? '#00ff88' : 'rgba(255,255,255,0.35)',
              transition: 'color 0.15s',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
