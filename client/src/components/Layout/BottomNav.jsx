import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useSafety } from '../../context/SafetyContext';

const BottomNav = () => {
  const { user } = useContext(AuthContext);
  const { sosActive, nearbyAlerts = [] } = useSafety();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user?.role === 'admin';

  const navLinks = [
    { to: '/dashboard', label: 'MAP', icon: '🗺️' },
    { to: '/contacts', label: 'CONTACTS', icon: '👥' },
    { to: '/sos', label: 'SOS', icon: '🆘', special: true },
    { to: '/safety', label: 'SAFETY', icon: '🛡️' },
    { to: isAdmin ? '/admin' : '/report', label: isAdmin ? 'ADMIN' : 'REPORT', icon: isAdmin ? '⚙️' : '📋' },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,13,20,0.97)',
      borderTop: '1px solid rgba(0,255,136,0.1)',
      backdropFilter: 'blur(16px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '6px 8px', maxWidth: 480, margin: '0 auto'
      }}>
        {navLinks.map(({ to, label, icon, special }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, textDecoration: 'none', position: 'relative',
              padding: special ? '6px 16px' : '6px 12px',
              borderRadius: special ? 8 : 6,
              background: special
                ? sosActive
                  ? 'rgba(255,51,102,0.25)'
                  : 'rgba(255,51,102,0.12)'
                : isActive
                  ? 'rgba(0,255,136,0.08)'
                  : 'transparent',
              border: special
                ? `1px solid ${sosActive ? 'rgba(255,51,102,0.7)' : 'rgba(255,51,102,0.3)'}`
                : '1px solid transparent',
              animation: special && sosActive ? 'pulse 1s infinite' : 'none',
              transition: 'all 0.2s',
              minWidth: 44,
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ fontSize: special ? 20 : 18 }}>{icon}</span>
                <span style={{
                  fontSize: 8, fontFamily: 'monospace', letterSpacing: 1,
                  color: special
                    ? '#ff3366'
                    : isActive
                      ? '#00ff88'
                      : 'rgba(255,255,255,0.4)',
                  fontWeight: isActive || special ? 700 : 400
                }}>
                  {label}
                </span>
                {/* Alert badge */}
                {label === 'CONTACTS' && nearbyAlerts.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#ff3366', color: 'white',
                    fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', fontWeight: 700
                  }}>
                    {nearbyAlerts.length > 9 ? '9+' : nearbyAlerts.length}
                  </div>
                )}
                {/* Active indicator */}
                {isActive && !special && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 16, height: 2, background: '#00ff88',
                    borderRadius: 1, boxShadow: '0 0 6px #00ff88'
                  }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
