import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BarChart = ({ data, color = '#7c3aed', label }) => {
  if (!data?.length) return <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 16 }}>No data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="bar-chart">
      <p className="chart-label">{label}</p>
      <div className="bars">
        {data.map((d, i) => (
          <div key={i} className="bar-item">
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  height: `${(d.count / max) * 100}%`,
                  background: color
                }}
              />
            </div>
            <span className="bar-value">{d.count}</span>
            <span className="bar-key">{d._id?.split('-').slice(1).join('/')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/api/admin/analytics');
      setData(res.data);
    } catch (err) {
      // Non-admin users won't have access - show personal stats
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-widget loading">
        <div className="spinner" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-widget">
        <div className="no-access">
          <span>📊</span>
          <p>Analytics available for admins only</p>
        </div>
      </div>
    );
  }

  const tabs = ['overview', 'incidents', 'charts'];

  return (
    <div className="analytics-widget">
      <div className="analytics-header">
        <h3>📊 Analytics</h3>
        <button onClick={fetchAnalytics} className="refresh-btn">↻</button>
      </div>

      <div className="tab-bar">
        {tabs.map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <div className="metric-val">{data.users.total.toLocaleString()}</div>
            <div className="metric-key">Total Users</div>
            <div className="metric-sub">+{data.users.today} today</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">⚠️</div>
            <div className="metric-val">{data.incidents.total.toLocaleString()}</div>
            <div className="metric-key">Incidents</div>
            <div className="metric-sub">+{data.incidents.today} today</div>
          </div>
          <div className="metric-card sos">
            <div className="metric-icon">🆘</div>
            <div className="metric-val">{data.sos.total.toLocaleString()}</div>
            <div className="metric-key">SOS Events</div>
            <div className="metric-sub">{data.sos.active} active now</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-val">{data.users.active30d.toLocaleString()}</div>
            <div className="metric-key">Active (30d)</div>
            <div className="metric-sub">active users</div>
          </div>
        </div>
      )}

      {tab === 'incidents' && (
        <div className="incidents-breakdown">
          <h4>By Type</h4>
          {data.incidents.byType.map(t => (
            <div key={t._id} className="breakdown-row">
              <span className="br-type">{t._id}</span>
              <div className="br-bar-container">
                <div
                  className="br-bar"
                  style={{ width: `${(t.count / (data.incidents.total || 1)) * 100}%` }}
                />
              </div>
              <span className="br-count">{t.count}</span>
            </div>
          ))}

          <h4 style={{ marginTop: 16 }}>By Severity</h4>
          {data.incidents.bySeverity.map(s => {
            const labels = { 1: '🟡 Low', 2: '🟠 Medium', 3: '🔴 High' };
            return (
              <div key={s._id} className="breakdown-row">
                <span className="br-type">{labels[s._id] || `Level ${s._id}`}</span>
                <div className="br-bar-container">
                  <div
                    className="br-bar"
                    style={{ width: `${(s.count / (data.incidents.total || 1)) * 100}%`, background: ['', '#fbbf24', '#f97316', '#ef4444'][s._id] }}
                  />
                </div>
                <span className="br-count">{s.count}</span>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'charts' && (
        <div className="charts-tab">
          <BarChart
            data={data.charts.sosLast7d}
            color="#ef4444"
            label="SOS Events - Last 7 Days"
          />
          <BarChart
            data={data.charts.incidentsLast7d}
            color="#f97316"
            label="Incidents - Last 7 Days"
          />
        </div>
      )}

      <style>{`
        .analytics-widget { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 16px; padding: 16px; }
        .analytics-widget.loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 150px; gap: 12px; }
        .spinner { width: 32px; height: 32px; border: 3px solid #2d2d3e; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .analytics-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .analytics-header h3 { margin: 0; color: #e2e8f0; font-size: 14px; }
        .refresh-btn { background: none; border: none; color: #7c3aed; cursor: pointer; font-size: 16px; }
        .tab-bar { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid #2d2d3e; padding-bottom: 8px; }
        .tab-btn { background: none; border: none; color: #64748b; padding: 4px 10px; cursor: pointer; font-size: 12px; border-radius: 6px; }
        .tab-btn.active { background: rgba(124,58,237,0.2); color: #c4b5fd; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .metric-card { background: #0f0f1a; border-radius: 10px; padding: 12px; border: 1px solid #2d2d3e; text-align: center; }
        .metric-card.sos { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); }
        .metric-icon { font-size: 20px; margin-bottom: 4px; }
        .metric-val { font-size: 22px; font-weight: 800; color: #e2e8f0; }
        .metric-key { font-size: 11px; color: #94a3b8; margin: 2px 0; }
        .metric-sub { font-size: 10px; color: #64748b; }
        .breakdown-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .br-type { font-size: 11px; color: #94a3b8; width: 80px; flex-shrink: 0; text-transform: capitalize; }
        .br-bar-container { flex: 1; background: #0f0f1a; border-radius: 3px; height: 8px; overflow: hidden; }
        .br-bar { height: 100%; background: #7c3aed; border-radius: 3px; transition: width 0.8s ease; min-width: 4px; }
        .br-count { font-size: 11px; color: #64748b; width: 30px; text-align: right; flex-shrink: 0; }
        .incidents-breakdown h4 { color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 0 0 8px; }
        .bar-chart { margin-bottom: 16px; }
        .chart-label { color: #94a3b8; font-size: 11px; margin: 0 0 8px; }
        .bars { display: flex; gap: 4px; align-items: flex-end; height: 80px; }
        .bar-item { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 2px; }
        .bar-track { flex: 1; width: 100%; background: #0f0f1a; border-radius: 4px; display: flex; align-items: flex-end; overflow: hidden; }
        .bar-fill { width: 100%; border-radius: 4px; min-height: 4px; transition: height 0.8s ease; }
        .bar-value { font-size: 10px; color: #e2e8f0; }
        .bar-key { font-size: 9px; color: #64748b; }
        .no-access { text-align: center; padding: 24px; }
        .no-access span { font-size: 36px; display: block; margin-bottom: 8px; }
        .no-access p { color: #64748b; font-size: 12px; margin: 0; }
      `}</style>
    </div>
  );
};

export default Analytics;
