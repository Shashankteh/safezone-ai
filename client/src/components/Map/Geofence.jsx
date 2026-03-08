import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const Geofence = ({ map, userLocation, onGeofenceCreated }) => {
  const [geofences, setGeofences] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('circle'); // circle | polygon
  const [newFence, setNewFence] = useState({ name: '', type: 'safe', radius: 200 });
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing geofences
  useEffect(() => {
    fetchGeofences();
  }, []);

  const fetchGeofences = async () => {
    try {
      const { data } = await api.get('/api/geofence');
      setGeofences(data.data.geofences || []);
    } catch (err) {
      console.error('Failed to load geofences:', err);
    }
  };

  const createGeofence = async () => {
    if (!newFence.name.trim()) {
      setError('Please enter a zone name');
      return;
    }
    if (!userLocation) {
      setError('Location not available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: newFence.name,
        type: newFence.type,
        alertOnEnter: true,
        alertOnExit: newFence.type === 'safe',
        center: { lat: userLocation.lat, lng: userLocation.lng },
        radius: parseInt(newFence.radius)
      };

      const { data } = await api.post('/api/geofence', payload);
      const created = data.data.geofence;
      setGeofences(prev => [created, ...prev]);
      setNewFence({ name: '', type: 'safe', radius: 200 });
      setShowPanel(false);
      onGeofenceCreated?.(created);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create geofence');
    } finally {
      setLoading(false);
    }
  };

  const deleteGeofence = async (id) => {
    try {
      await api.delete(`/api/geofence/${id}`);
      setGeofences(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const toggleGeofence = async (id, active) => {
    try {
      await api.put(`/api/geofence/${id}`, { active: !active });
      setGeofences(prev => prev.map(f => f._id === id ? { ...f, active: !f.active } : f));
    } catch {}
  };

  const typeColors = { safe: '#10b981', danger: '#ef4444' };

  return (
    <div className="geofence-container">
      {/* Toggle button */}
      <button
        className="geofence-toggle-btn"
        onClick={() => setShowPanel(!showPanel)}
        title="Manage Zones"
      >
        <span>🗺️</span>
        {geofences.filter(f => f.active).length > 0 && (
          <span className="badge">{geofences.filter(f => f.active).length}</span>
        )}
      </button>

      {showPanel && (
        <div className="geofence-panel">
          <div className="panel-header">
            <h3>🗺️ Safety Zones</h3>
            <button onClick={() => setShowPanel(false)}>✕</button>
          </div>

          {/* Create new zone */}
          <div className="create-zone">
            <h4>+ Create Zone at Current Location</h4>
            <input
              type="text"
              placeholder="Zone name (e.g., Home, Office)"
              value={newFence.name}
              onChange={e => setNewFence(p => ({ ...p, name: e.target.value }))}
            />

            <div className="type-row">
              {['safe', 'danger'].map(t => (
                <button
                  key={t}
                  className={`type-btn ${newFence.type === t ? 'active' : ''} ${t}`}
                  onClick={() => setNewFence(p => ({ ...p, type: t }))}
                >
                  {t === 'safe' ? '✅ Safe Zone' : '⚠️ Danger Zone'}
                </button>
              ))}
            </div>

            <div className="radius-row">
              <label>Radius: {newFence.radius}m</label>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={newFence.radius}
                onChange={e => setNewFence(p => ({ ...p, radius: e.target.value }))}
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button
              className="create-btn"
              onClick={createGeofence}
              disabled={loading}
            >
              {loading ? 'Creating...' : '+ Create Zone'}
            </button>
          </div>

          {/* Existing zones */}
          <div className="zones-list">
            <h4>Your Zones ({geofences.length})</h4>
            {geofences.length === 0 ? (
              <p className="empty-msg">No zones yet. Create your first safety zone!</p>
            ) : (
              geofences.map(fence => (
                <div key={fence._id} className={`zone-item ${!fence.active ? 'inactive' : ''}`}>
                  <div className="zone-info">
                    <span
                      className="zone-dot"
                      style={{ background: typeColors[fence.type] }}
                    />
                    <div>
                      <strong>{fence.name}</strong>
                      <small>{fence.type === 'safe' ? '✅ Safe' : '⚠️ Danger'} · {fence.radius}m radius</small>
                    </div>
                  </div>
                  <div className="zone-actions">
                    <button
                      className={`toggle-btn ${fence.active ? 'on' : 'off'}`}
                      onClick={() => toggleGeofence(fence._id, fence.active)}
                      title={fence.active ? 'Disable' : 'Enable'}
                    >
                      {fence.active ? '●' : '○'}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteGeofence(fence._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .geofence-container { position: absolute; bottom: 80px; right: 16px; z-index: 100; }
        .geofence-toggle-btn {
          background: #1e1e2e; border: 1px solid #7c3aed; border-radius: 50%;
          width: 48px; height: 48px; font-size: 20px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          position: relative; box-shadow: 0 4px 12px rgba(124,58,237,0.4);
        }
        .badge {
          position: absolute; top: -4px; right: -4px;
          background: #7c3aed; color: white; border-radius: 50%;
          width: 18px; height: 18px; font-size: 11px;
          display: flex; align-items: center; justify-content: center;
        }
        .geofence-panel {
          position: absolute; bottom: 60px; right: 0;
          background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 12px;
          width: 300px; max-height: 500px; overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .panel-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border-bottom: 1px solid #2d2d3e;
        }
        .panel-header h3 { margin: 0; color: #e2e8f0; font-size: 14px; }
        .panel-header button { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; }
        .create-zone { padding: 12px 16px; border-bottom: 1px solid #2d2d3e; }
        .create-zone h4 { margin: 0 0 8px; color: #7c3aed; font-size: 12px; }
        .create-zone input {
          width: 100%; padding: 8px; background: #0f0f1a; border: 1px solid #2d2d3e;
          border-radius: 6px; color: #e2e8f0; font-size: 13px; box-sizing: border-box; margin-bottom: 8px;
        }
        .type-row { display: flex; gap: 6px; margin-bottom: 8px; }
        .type-btn {
          flex: 1; padding: 6px; border: 1px solid #2d2d3e; border-radius: 6px;
          background: #0f0f1a; color: #94a3b8; font-size: 11px; cursor: pointer;
        }
        .type-btn.active.safe { background: rgba(16,185,129,0.2); border-color: #10b981; color: #10b981; }
        .type-btn.active.danger { background: rgba(239,68,68,0.2); border-color: #ef4444; color: #ef4444; }
        .radius-row label { display: block; color: #94a3b8; font-size: 11px; margin-bottom: 4px; }
        .radius-row input { width: 100%; accent-color: #7c3aed; }
        .error-msg { color: #f87171; font-size: 11px; margin: 4px 0; }
        .create-btn {
          width: 100%; padding: 8px; background: #7c3aed; border: none;
          border-radius: 6px; color: white; font-size: 13px; cursor: pointer; margin-top: 8px;
        }
        .create-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .zones-list { padding: 12px 16px; }
        .zones-list h4 { margin: 0 0 8px; color: #94a3b8; font-size: 11px; text-transform: uppercase; }
        .empty-msg { color: #64748b; font-size: 12px; text-align: center; padding: 12px 0; }
        .zone-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px; border-radius: 8px; margin-bottom: 6px;
          background: #0f0f1a; border: 1px solid #2d2d3e;
        }
        .zone-item.inactive { opacity: 0.5; }
        .zone-info { display: flex; align-items: center; gap: 8px; }
        .zone-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .zone-info strong { color: #e2e8f0; font-size: 13px; display: block; }
        .zone-info small { color: #64748b; font-size: 11px; }
        .zone-actions { display: flex; gap: 4px; }
        .toggle-btn, .delete-btn {
          background: none; border: none; cursor: pointer;
          font-size: 14px; padding: 4px; border-radius: 4px;
        }
        .toggle-btn.on { color: #10b981; }
        .toggle-btn.off { color: #64748b; }
        .delete-btn:hover { background: rgba(239,68,68,0.2); }
      `}</style>
    </div>
  );
};

export default Geofence;
