import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

const StatCard = ({ icon, label, value, color = '#00ff88', sub }) => (
  <div style={{
    background: 'rgba(10,22,40,0.85)', border: `1px solid ${color}22`,
    borderRadius: '12px', padding: '20px 16px',
    display: 'flex', flexDirection: 'column', gap: '6px',
    boxShadow: `0 0 20px ${color}08`,
  }}>
    <span style={{ fontSize: '24px' }}>{icon}</span>
    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '26px', fontWeight: 900, color }}>{value}</span>
    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
    {sub && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}>{sub}</span>}
  </div>
);

const Admin = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [sos, setSos] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('accessToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, sosRes] = await Promise.allSettled([
        axios.get(`${API}/admin/analytics`, { headers }),
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/admin/sos/active`, { headers }),
      ]);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.data?.users || []);
      if (sosRes.status === 'fulfilled') setSos(sosRes.value.data.data?.events || []);
    } catch {}
    setLoading(false);
  };

  const toggleUser = async (id, currentStatus) => {
    try {
      await axios.put(`${API}/admin/users/${id}/toggle`, {}, { headers });
      toast.success('User status updated');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return (
    <div style={{
      minHeight: '100vh', background: '#050d14',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '16px', fontFamily: "'Rajdhani', sans-serif",
    }}>
      <span style={{ fontSize: '64px' }}>🚫</span>
      <h2 style={{ color: 'white', fontFamily: "'Orbitron', monospace" }}>Admin Only</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
        You don't have admin privileges.
      </p>
    </div>
  );

  const stats = {
    totalUsers: analytics?.totalUsers || users.length || 0,
    activeUsers: analytics?.activeUsers || 0,
    totalSOS: analytics?.totalSOS || 0,
    incidents: analytics?.totalIncidents || 0,
  };

  const tabs = ['overview', 'users', 'sos'];

  const card = {
    background: 'rgba(10,22,40,0.85)', border: '1px solid rgba(0,255,136,0.1)',
    borderRadius: '12px', padding: '20px', marginBottom: '14px',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050d14',
      backgroundImage: 'radial-gradient(ellipse at top right, rgba(168,85,247,0.05) 0%, transparent 60%)',
      padding: '24px 16px 90px', fontFamily: "'Rajdhani', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(168,85,247,0.6)', marginBottom: '4px' }}>
            07 — ADMIN
          </div>
          <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', color: 'white', margin: 0 }}>
            CONTROL CENTER
          </h1>
        </div>
        <button onClick={fetchAll} style={{
          background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '8px', padding: '8px 16px', color: 'rgba(168,85,247,0.8)',
          cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
        }}>🔄 REFRESH</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
            background: tab === t ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${tab === t ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
            color: tab === t ? '#a855f7' : 'rgba(255,255,255,0.4)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
            textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s',
          }}>{t}</button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(168,85,247,0.5)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
          Loading data...
        </div>
      )}

      {/* OVERVIEW TAB */}
      {tab === 'overview' && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <StatCard icon="👥" label="TOTAL USERS" value={stats.totalUsers} color="#00ff88" />
            <StatCard icon="🟢" label="ACTIVE NOW" value={stats.activeUsers} color="#00c8ff" />
            <StatCard icon="🆘" label="SOS EVENTS" value={stats.totalSOS} color="#ff3366" />
            <StatCard icon="⚠️" label="INCIDENTS" value={stats.incidents} color="#ffaa00" />
          </div>

          {/* System Status */}
          <div style={card}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(168,85,247,0.5)', marginBottom: '16px' }}>
              <span style={{ color: 'rgba(168,85,247,0.3)' }}>// </span>SYSTEM_STATUS
            </div>
            {[
              { name: 'Backend API', status: 'online', port: '5000' },
              { name: 'MongoDB', status: 'online', port: '27017' },
              { name: 'Socket.io', status: 'online', port: '5000' },
              { name: 'Python AI', status: 'offline', port: '8000' },
              { name: 'Redis', status: 'offline', port: '6379' },
            ].map(({ name, status, port }) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: status === 'online' ? '#00ff88' : '#ff3366',
                    boxShadow: `0 0 6px ${status === 'online' ? '#00ff88' : '#ff3366'}`,
                    animation: status === 'online' ? 'pulse 2s infinite' : 'none',
                  }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{name}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>:{port}</span>
                  <span style={{
                    background: status === 'online' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)',
                    border: `1px solid ${status === 'online' ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,
                    borderRadius: '4px', padding: '2px 8px',
                    color: status === 'online' ? '#00ff88' : '#ff3366',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                  }}>{status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active SOS */}
          {sos.length > 0 && (
            <div style={{ ...card, borderColor: 'rgba(255,51,102,0.3)' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,51,102,0.6)', marginBottom: '16px' }}>
                <span style={{ color: 'rgba(255,51,102,0.3)' }}>// </span>ACTIVE_SOS_EVENTS
              </div>
              {sos.map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.2)',
                  borderRadius: '8px', padding: '12px', marginBottom: '8px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ color: '#ff3366', fontWeight: 600 }}>{s.user?.name || 'Unknown'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>
                      {new Date(s.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <span style={{ fontSize: '20px', animation: 'pulse 1s infinite' }}>🆘</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* USERS TAB */}
      {tab === 'users' && !loading && (
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
            {users.length} USERS REGISTERED
          </div>
          {users.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>No users found</p>
            </div>
          ) : users.map((u, i) => (
            <div key={u._id || i} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: u.role === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(0,255,136,0.1)',
                  border: `1px solid ${u.role === 'admin' ? 'rgba(168,85,247,0.4)' : 'rgba(0,255,136,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>{u.role === 'admin' ? '👑' : '👤'}</div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>{u.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{u.email}</div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{u.phone}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{
                  background: u.role === 'admin' ? 'rgba(168,85,247,0.15)' : 'rgba(0,255,136,0.1)',
                  border: `1px solid ${u.role === 'admin' ? 'rgba(168,85,247,0.4)' : 'rgba(0,255,136,0.2)'}`,
                  borderRadius: '4px', padding: '2px 8px',
                  color: u.role === 'admin' ? '#a855f7' : '#00ff88',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                }}>{(u.role || 'user').toUpperCase()}</span>
                {u.role !== 'admin' && (
                  <button onClick={() => toggleUser(u._id, u.isActive)} style={{
                    background: u.isActive === false ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)',
                    border: `1px solid ${u.isActive === false ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,
                    borderRadius: '4px', padding: '4px 10px',
                    color: u.isActive === false ? '#00ff88' : '#ff3366',
                    cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                  }}>{u.isActive === false ? 'ENABLE' : 'DISABLE'}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SOS TAB */}
      {tab === 'sos' && !loading && (
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
            {sos.length} ACTIVE SOS EVENT{sos.length !== 1 ? 'S' : ''}
          </div>
          {sos.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: 'rgba(0,255,136,0.5)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                No active SOS events — all clear!
              </p>
            </div>
          ) : sos.map((s, i) => (
            <div key={i} style={{ ...card, borderColor: 'rgba(255,51,102,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#ff3366', fontWeight: 700, fontSize: '15px' }}>🆘 {s.user?.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(s.createdAt).toLocaleString()}
                </span>
              </div>
              {s.location?.coordinates && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(0,200,255,0.6)' }}>
                  📍 {s.location.coordinates[1]?.toFixed(4)}, {s.location.coordinates[0]?.toFixed(4)}
                </div>
              )}
              {s.message && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '6px' }}>{s.message}</div>}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
};

export default Admin;
