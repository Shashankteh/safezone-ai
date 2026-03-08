import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

// ── Mini Components ────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = '#7c3aed' }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: `${color}20`, color }}>{icon}</div>
    <div>
      <div className="stat-val">{value}</div>
      <div className="stat-lbl">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

const Badge = ({ children, color }) => (
  <span className="badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
    {children}
  </span>
);

// ── Main Admin Dashboard ───────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeSOS, setActiveSOS] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({});
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, sosRes, healthRes] = await Promise.allSettled([
        api.get('/api/admin/analytics'),
        api.get('/api/admin/sos/active'),
        api.get('/api/admin/health')
      ]);

      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data.data);
      if (sosRes.status === 'fulfilled') setActiveSOS(sosRes.value.data.data.events || []);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data.data);
    } catch {}
    setLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: userPage, limit: 10 });
      if (search) params.append('search', search);
      const { data } = await api.get(`/api/admin/users?${params}`);
      setUsers(data.data.users || []);
      setUserPagination(data.data.pagination || {});
    } catch {}
  }, [userPage, search]);

  const fetchIncidents = useCallback(async () => {
    try {
      const { data } = await api.get('/api/incident/all?limit=20');
      setIncidents(data.data.incidents || []);
    } catch {}
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'incidents') fetchIncidents();
  }, [tab, fetchUsers, fetchIncidents]);

  const toggleUser = async (id) => {
    try {
      const { data } = await api.put(`/api/admin/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: data.data.isActive } : u));
      showNotif(`User ${data.data.isActive ? 'activated' : 'deactivated'}`);
    } catch { showNotif('Action failed', 'error'); }
  };

  const verifyIncident = async (id) => {
    try {
      await api.put(`/api/admin/incident/${id}/verify`);
      setIncidents(prev => prev.map(i => i._id === id ? { ...i, verified: true } : i));
      showNotif('Incident verified');
    } catch { showNotif('Failed to verify', 'error'); }
  };

  const deleteIncident = async (id) => {
    if (!window.confirm('Delete this incident?')) return;
    try {
      await api.delete(`/api/admin/incident/${id}`);
      setIncidents(prev => prev.filter(i => i._id !== id));
      showNotif('Incident deleted');
    } catch { showNotif('Failed to delete', 'error'); }
  };

  const severityColor = { 1: '#fbbf24', 2: '#f97316', 3: '#ef4444' };
  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'sos', label: `🆘 Active SOS ${activeSOS.length > 0 ? `(${activeSOS.length})` : ''}` },
    { id: 'users', label: '👥 Users' },
    { id: 'incidents', label: '⚠️ Incidents' },
    { id: 'system', label: '🖥️ System' }
  ];

  if (loading) return (
    <div className="admin-loading">
      <div className="admin-spinner" />
      <p>Loading admin panel...</p>
    </div>
  );

  return (
    <div className="admin-dashboard">
      {notification && (
        <div className={`admin-notif ${notification.type}`}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.msg}
        </div>
      )}

      <div className="admin-header">
        <div>
          <h1>🛡️ SafeZone Admin</h1>
          <p>System control panel</p>
        </div>
        <button className="refresh-all-btn" onClick={fetchAll}>↻ Refresh</button>
      </div>

      {/* Tab bar */}
      <div className="tab-strip">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && analytics && (
        <div className="overview-tab">
          <div className="stats-grid">
            <StatCard icon="👥" label="Total Users" value={analytics.users.total} sub={`+${analytics.users.today} today`} color="#7c3aed" />
            <StatCard icon="🟢" label="Active (30d)" value={analytics.users.active30d} sub="unique users" color="#10b981" />
            <StatCard icon="⚠️" label="Total Incidents" value={analytics.incidents.total} sub={`+${analytics.incidents.today} today`} color="#f59e0b" />
            <StatCard icon="🆘" label="SOS Events" value={analytics.sos.total} sub={`${analytics.sos.active} active`} color="#ef4444" />
          </div>

          <div className="overview-charts">
            <div className="chart-section">
              <h4>Incidents by Type</h4>
              {analytics.incidents.byType.map(t => (
                <div key={t._id} className="chart-row">
                  <span className="chart-key">{t._id}</span>
                  <div className="chart-bar-bg">
                    <div className="chart-bar" style={{ width: `${(t.count / (analytics.incidents.total || 1)) * 100}%` }} />
                  </div>
                  <span className="chart-val">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Active SOS ── */}
      {tab === 'sos' && (
        <div className="sos-tab">
          {activeSOS.length === 0 ? (
            <div className="empty-state">
              <span>✅</span>
              <h3>No Active SOS Events</h3>
              <p>All clear</p>
            </div>
          ) : (
            activeSOS.map(event => (
              <div key={event._id} className="sos-card">
                <div className="sos-pulse" />
                <div className="sos-info">
                  <strong>{event.userId?.name || 'Unknown User'}</strong>
                  <span>{event.userId?.phone}</span>
                  <span>{event.userId?.email}</span>
                  <div className="sos-meta">
                    <Badge color="#ef4444">🆘 {event.triggerType}</Badge>
                    <span className="sos-time">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.location && (
                    <a
                      href={`https://maps.google.com/?q=${event.location.lat},${event.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-link"
                    >
                      📍 View on Maps
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'users' && (
        <div className="users-tab">
          <div className="users-controls">
            <input
              className="search-input"
              placeholder="Search users by name, email, phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setUserPage(1); }}
            />
          </div>

          <div className="users-table">
            <div className="table-header">
              <span>User</span>
              <span>Phone</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {users.map(u => (
              <div key={u._id} className={`table-row ${!u.isActive ? 'disabled' : ''}`}>
                <div className="user-cell">
                  <div className="user-avatar">{u.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </div>
                </div>
                <span className="phone-cell">{u.phone}</span>
                <Badge color={u.role === 'admin' ? '#f59e0b' : '#7c3aed'}>{u.role}</Badge>
                <Badge color={u.isActive ? '#10b981' : '#64748b'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                <div className="row-actions">
                  <button className="action-btn toggle" onClick={() => toggleUser(u._id)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {userPagination.pages > 1 && (
            <div className="pagination">
              <button disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>← Prev</button>
              <span>{userPage} / {userPagination.pages}</span>
              <button disabled={userPage >= userPagination.pages} onClick={() => setUserPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Incidents ── */}
      {tab === 'incidents' && (
        <div className="incidents-tab">
          <div className="incidents-list">
            {incidents.map(inc => (
              <div key={inc._id} className="incident-row">
                <div className="inc-severity-dot" style={{ background: severityColor[inc.severity] }} />
                <div className="inc-details">
                  <strong>{inc.type}</strong>
                  <small>{inc.description?.slice(0, 60) || 'No description'}</small>
                  <small className="inc-meta">
                    📍 {inc.coordinates?.lat?.toFixed(4)}, {inc.coordinates?.lng?.toFixed(4)} ·
                    👤 {inc.reportedBy?.name || 'Anonymous'} ·
                    🕐 {new Date(inc.timestamp).toLocaleString()}
                  </small>
                </div>
                <div className="inc-badges">
                  {inc.verified ? <Badge color="#10b981">✓ Verified</Badge> : <Badge color="#f59e0b">Unverified</Badge>}
                  <Badge color={severityColor[inc.severity]}>Sev {inc.severity}</Badge>
                </div>
                <div className="inc-actions">
                  {!inc.verified && (
                    <button className="action-btn verify" onClick={() => verifyIncident(inc._id)}>✓ Verify</button>
                  )}
                  <button className="action-btn delete" onClick={() => deleteIncident(inc._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── System ── */}
      {tab === 'system' && health && (
        <div className="system-tab">
          <div className="health-grid">
            <div className="health-item">
              <span className="health-dot green" />
              <span>Database</span>
              <Badge color="#10b981">{health.database}</Badge>
            </div>
            <div className="health-item">
              <span>⏱️ Uptime</span>
              <Badge color="#7c3aed">{Math.round(health.uptime)}s</Badge>
            </div>
            <div className="health-item">
              <span>👥 Users</span>
              <Badge color="#7c3aed">{health.collections.users}</Badge>
            </div>
            <div className="health-item">
              <span>⚠️ Incidents</span>
              <Badge color="#f59e0b">{health.collections.incidents}</Badge>
            </div>
            <div className="health-item">
              <span>🆘 Active SOS</span>
              <Badge color={health.collections.activeSOS > 0 ? '#ef4444' : '#10b981'}>
                {health.collections.activeSOS}
              </Badge>
            </div>
          </div>

          <div className="mem-usage">
            <h4>Memory Usage</h4>
            {health.memory && Object.entries(health.memory).map(([k, v]) => (
              <div key={k} className="mem-row">
                <span className="mem-key">{k}</span>
                <span className="mem-val">{Math.round(v / 1024 / 1024)}MB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .admin-dashboard { background: #0f0f1a; min-height: 100vh; padding: 20px; color: #e2e8f0; }
        .admin-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 12px; color: #94a3b8; }
        .admin-spinner { width: 48px; height: 48px; border: 4px solid #2d2d3e; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .admin-notif { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; z-index: 9999; font-size: 13px; font-weight: 600; }
        .admin-notif.success { background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #34d399; }
        .admin-notif.error { background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #f87171; }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .admin-header h1 { margin: 0; font-size: 24px; }
        .admin-header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
        .refresh-all-btn { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 8px; color: #7c3aed; padding: 8px 16px; cursor: pointer; font-size: 13px; }
        .tab-strip { display: flex; gap: 4px; margin-bottom: 20px; overflow-x: auto; }
        .tab { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 8px; color: #64748b; padding: 8px 14px; cursor: pointer; font-size: 12px; white-space: nowrap; }
        .tab.active { background: rgba(124,58,237,0.2); border-color: #7c3aed; color: #c4b5fd; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; }
        .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .stat-val { font-size: 22px; font-weight: 800; color: #e2e8f0; }
        .stat-lbl { font-size: 11px; color: #94a3b8; }
        .stat-sub { font-size: 10px; color: #64748b; }
        .overview-charts { background: #1e1e2e; border-radius: 12px; border: 1px solid #2d2d3e; padding: 16px; }
        .chart-section h4 { margin: 0 0 12px; color: #94a3b8; font-size: 11px; text-transform: uppercase; }
        .chart-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .chart-key { font-size: 12px; color: #94a3b8; width: 100px; text-transform: capitalize; flex-shrink: 0; }
        .chart-bar-bg { flex: 1; background: #0f0f1a; border-radius: 4px; height: 10px; overflow: hidden; }
        .chart-bar { height: 100%; background: linear-gradient(90deg, #7c3aed, #a855f7); border-radius: 4px; min-width: 4px; transition: width 0.8s ease; }
        .chart-val { font-size: 12px; color: #e2e8f0; font-weight: 600; width: 30px; text-align: right; }
        .sos-tab { display: flex; flex-direction: column; gap: 12px; }
        .empty-state { text-align: center; padding: 48px; background: #1e1e2e; border-radius: 12px; border: 1px solid #2d2d3e; }
        .empty-state span { font-size: 48px; display: block; margin-bottom: 12px; }
        .empty-state h3 { margin: 0 0 4px; color: #e2e8f0; }
        .empty-state p { color: #64748b; margin: 0; }
        .sos-card { background: #1e1e2e; border: 1px solid rgba(239,68,68,0.4); border-radius: 12px; padding: 16px; display: flex; align-items: flex-start; gap: 12px; position: relative; overflow: hidden; }
        .sos-pulse { width: 12px; height: 12px; background: #ef4444; border-radius: 50%; flex-shrink: 0; margin-top: 4px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .sos-info strong { color: #e2e8f0; font-size: 15px; display: block; }
        .sos-info span { color: #94a3b8; font-size: 12px; display: block; }
        .sos-meta { display: flex; gap: 8px; align-items: center; margin: 6px 0; }
        .sos-time { color: #64748b; font-size: 11px; }
        .map-link { color: #7c3aed; font-size: 12px; text-decoration: none; }
        .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .users-controls { margin-bottom: 12px; }
        .search-input { width: 100%; padding: 10px 14px; background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 8px; color: #e2e8f0; font-size: 13px; box-sizing: border-box; }
        .users-table { background: #1e1e2e; border-radius: 12px; border: 1px solid #2d2d3e; overflow: hidden; }
        .table-header { display: grid; grid-template-columns: 2fr 1.2fr 0.8fr 0.8fr 1fr; gap: 8px; padding: 10px 16px; background: #0f0f1a; font-size: 11px; color: #64748b; text-transform: uppercase; }
        .table-row { display: grid; grid-template-columns: 2fr 1.2fr 0.8fr 0.8fr 1fr; gap: 8px; padding: 12px 16px; border-top: 1px solid #2d2d3e; align-items: center; }
        .table-row.disabled { opacity: 0.5; }
        .user-cell { display: flex; align-items: center; gap: 8px; }
        .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #7c3aed; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
        .user-cell strong { color: #e2e8f0; font-size: 13px; display: block; }
        .user-cell small { color: #64748b; font-size: 11px; }
        .phone-cell { color: #94a3b8; font-size: 12px; }
        .row-actions { display: flex; gap: 4px; }
        .action-btn { padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 600; }
        .action-btn.toggle { background: rgba(124,58,237,0.2); color: #c4b5fd; }
        .action-btn.verify { background: rgba(16,185,129,0.2); color: #34d399; }
        .action-btn.delete { background: rgba(239,68,68,0.2); color: #f87171; }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 12px; }
        .pagination button { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 6px; color: #7c3aed; padding: 6px 12px; cursor: pointer; font-size: 12px; }
        .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
        .pagination span { color: #94a3b8; font-size: 12px; }
        .incidents-list { display: flex; flex-direction: column; gap: 8px; }
        .incident-row { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 10px; padding: 12px; display: flex; align-items: flex-start; gap: 10px; }
        .inc-severity-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
        .inc-details { flex: 1; min-width: 0; }
        .inc-details strong { color: #e2e8f0; font-size: 13px; text-transform: capitalize; display: block; }
        .inc-details small { color: #94a3b8; font-size: 11px; display: block; }
        .inc-meta { color: #64748b !important; font-size: 10px !important; }
        .inc-badges { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; flex-shrink: 0; }
        .inc-actions { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .health-grid { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
        .health-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; }
        .health-dot { width: 8px; height: 8px; border-radius: 50%; }
        .health-dot.green { background: #10b981; }
        .mem-usage { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 12px; padding: 16px; }
        .mem-usage h4 { margin: 0 0 12px; color: #94a3b8; font-size: 11px; text-transform: uppercase; }
        .mem-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #2d2d3e; font-size: 12px; }
        .mem-key { color: #94a3b8; }
        .mem-val { color: #e2e8f0; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
