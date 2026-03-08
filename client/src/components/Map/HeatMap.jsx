import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const HeatMap = ({ userLocation }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('48h');
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });

  useEffect(() => {
    fetchHeatmapData();
  }, [timeRange]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/incident/heatmap');
      const pts = data.data.heatmapPoints || [];
      setIncidents(pts);

      const s = pts.reduce((acc, p) => {
        acc.total++;
        if (p.intensity === 3) acc.high++;
        else if (p.intensity === 2) acc.medium++;
        else acc.low++;
        return acc;
      }, { total: 0, high: 0, medium: 0, low: 0 });
      setStats(s);
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    } finally {
      setLoading(false);
    }
  };

  const incidentTypes = [...new Set(incidents.map(i => i.type))];

  const filtered = filter === 'all'
    ? incidents
    : incidents.filter(i => i.type === filter);

  const severityColor = { 1: '#fbbf24', 2: '#f97316', 3: '#ef4444' };
  const severityLabel = { 1: 'Low', 2: 'Medium', 3: 'High' };

  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const nearbyCount = userLocation
    ? filtered.filter(i => haversine(userLocation.lat, userLocation.lng, i.lat, i.lng) <= 1000).length
    : 0;

  return (
    <div className="heatmap-panel">
      <div className="hm-header">
        <span>🔥 Incident Heatmap</span>
        <button onClick={fetchHeatmapData} className="refresh-btn" title="Refresh">↻</button>
      </div>

      {/* Stats */}
      <div className="hm-stats">
        <div className="stat-box total">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-lbl">Total</span>
        </div>
        <div className="stat-box high">
          <span className="stat-num">{stats.high}</span>
          <span className="stat-lbl">High</span>
        </div>
        <div className="stat-box medium">
          <span className="stat-num">{stats.medium}</span>
          <span className="stat-lbl">Medium</span>
        </div>
        <div className="stat-box low">
          <span className="stat-num">{stats.low}</span>
          <span className="stat-lbl">Low</span>
        </div>
      </div>

      {nearbyCount > 0 && (
        <div className="nearby-alert">
          ⚠️ {nearbyCount} incident{nearbyCount > 1 ? 's' : ''} within 1km of you
        </div>
      )}

      {/* Filter */}
      <div className="hm-filters">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {incidentTypes.map(t => (
          <button
            key={t}
            className={`filter-btn ${filter === t ? 'active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="hm-legend">
        {[1, 2, 3].map(s => (
          <div key={s} className="legend-item">
            <span className="legend-dot" style={{ background: severityColor[s] }} />
            <span>{severityLabel[s]}</span>
          </div>
        ))}
      </div>

      {/* Incident list */}
      <div className="incident-list">
        {loading ? (
          <div className="loading-msg">Loading incidents...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-msg">No incidents found</div>
        ) : (
          filtered.slice(0, 15).map((inc, i) => (
            <div key={i} className="incident-item">
              <span className="inc-dot" style={{ background: severityColor[inc.intensity] }} />
              <div className="inc-info">
                <strong>{inc.type}</strong>
                <small>
                  {inc.lat?.toFixed(4)}, {inc.lng?.toFixed(4)}
                  {userLocation && (
                    <> · {Math.round(haversine(userLocation.lat, userLocation.lng, inc.lat, inc.lng))}m away</>
                  )}
                </small>
              </div>
              <span className="inc-severity" style={{ color: severityColor[inc.intensity] }}>
                {severityLabel[inc.intensity]}
              </span>
            </div>
          ))
        )}
        {filtered.length > 15 && (
          <p className="more-msg">+{filtered.length - 15} more incidents</p>
        )}
      </div>

      <style>{`
        .heatmap-panel {
          background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 12px;
          padding: 12px; width: 280px; max-height: 420px; overflow-y: auto;
        }
        .hm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; color: #e2e8f0; font-weight: 600; font-size: 13px; }
        .refresh-btn { background: none; border: none; color: #7c3aed; cursor: pointer; font-size: 16px; }
        .hm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
        .stat-box { background: #0f0f1a; border-radius: 8px; padding: 6px; text-align: center; border: 1px solid #2d2d3e; }
        .stat-box.high { border-color: rgba(239,68,68,0.3); }
        .stat-box.medium { border-color: rgba(249,115,22,0.3); }
        .stat-box.low { border-color: rgba(251,191,36,0.3); }
        .stat-num { display: block; font-size: 16px; font-weight: 700; color: #e2e8f0; }
        .stat-lbl { font-size: 10px; color: #64748b; }
        .nearby-alert { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 6px 8px; color: #f87171; font-size: 11px; margin-bottom: 8px; }
        .hm-filters { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
        .filter-btn { padding: 3px 8px; border-radius: 12px; border: 1px solid #2d2d3e; background: #0f0f1a; color: #94a3b8; font-size: 11px; cursor: pointer; text-transform: capitalize; }
        .filter-btn.active { background: #7c3aed; border-color: #7c3aed; color: white; }
        .hm-legend { display: flex; gap: 12px; margin-bottom: 8px; }
        .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #94a3b8; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .incident-list { display: flex; flex-direction: column; gap: 4px; }
        .incident-item { display: flex; align-items: center; gap: 8px; padding: 6px; background: #0f0f1a; border-radius: 6px; }
        .inc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .inc-info { flex: 1; min-width: 0; }
        .inc-info strong { color: #e2e8f0; font-size: 12px; display: block; text-transform: capitalize; }
        .inc-info small { color: #64748b; font-size: 10px; }
        .inc-severity { font-size: 10px; font-weight: 600; flex-shrink: 0; }
        .loading-msg, .empty-msg { text-align: center; color: #64748b; font-size: 12px; padding: 16px; }
        .more-msg { text-align: center; color: #64748b; font-size: 11px; margin: 4px 0 0; }
      `}</style>
    </div>
  );
};

export default HeatMap;
