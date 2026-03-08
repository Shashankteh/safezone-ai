import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const INCIDENT_TYPES = [
  { value: 'theft', label: '🦹 Theft', color: '#ff9900' },
  { value: 'assault', label: '⚠️ Assault', color: '#ff3366' },
  { value: 'harassment', label: '😡 Harassment', color: '#ff6600' },
  { value: 'accident', label: '🚗 Accident', color: '#ffcc00' },
  { value: 'suspicious', label: '👀 Suspicious Activity', color: '#aa88ff' },
  { value: 'other', label: '📌 Other', color: '#00c8ff' },
];

const IncidentReport = () => {
  const [form, setForm] = useState({
    type: 'suspicious', description: '', severity: 2,
    location: null,
  });
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  const token = localStorage.getItem('accessToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchNearby(); }, []);

  const fetchNearby = async () => {
    try {
      const res = await axios.get(`${API}/incident/nearby?radius=5000`, { headers });
      setIncidents(res.data?.data?.incidents || []);
    } catch { }
  };

  const getLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
        setGettingLocation(false);
        toast.success('📍 Location captured!');
      },
      () => { toast.error('Location access denied'); setGettingLocation(false); }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.location) { toast.error('Please capture your location first'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/incident/report`, {
        type: form.type,
        description: form.description,
        severity: form.severity,
        location: { type: 'Point', coordinates: [form.location.lng, form.location.lat] },
      }, { headers });
      toast.success('Incident reported! ✅');
      setForm({ type: 'suspicious', description: '', severity: 2, location: null });
      fetchNearby();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report');
    } finally { setLoading(false); }
  };

  const cardStyle = {
    background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(0,255,136,0.1)',
    borderRadius: '10px', padding: '20px', marginBottom: '12px',
  };

  const severityColors = ['', '#00ff88', '#ffcc00', '#ff9900', '#ff3366'];

  return (
    <div style={{
      minHeight: '100vh', background: '#050d14',
      padding: '20px 16px 80px', fontFamily: "'Rajdhani', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,51,102,0.6)', marginBottom: '4px' }}>
          05 — INCIDENTS
        </div>
        <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', color: 'white', margin: 0 }}>
          REPORT INCIDENT
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' }}>
          Help keep your community safe
        </p>
      </div>

      {/* Report Form */}
      <div style={cardStyle}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,51,102,0.5)', marginBottom: '16px' }}>
          <span style={{ color: 'rgba(255,51,102,0.3)' }}>// </span>NEW_INCIDENT
        </div>

        <form onSubmit={submit}>
          {/* Type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Incident Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {INCIDENT_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  style={{
                    padding: '10px', borderRadius: '6px', cursor: 'pointer',
                    border: `1px solid ${form.type === t.value ? t.color : 'rgba(255,255,255,0.1)'}`,
                    background: form.type === t.value ? `${t.color}22` : 'rgba(255,255,255,0.02)',
                    color: form.type === t.value ? t.color : 'rgba(255,255,255,0.5)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                    textAlign: 'left', transition: 'all 0.2s',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Severity: <span style={{ color: severityColors[form.severity] }}>{'●'.repeat(form.severity)}{'○'.repeat(4 - form.severity)}</span>
            </label>
            <input type="range" min="1" max="4" value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: +e.target.value }))}
              style={{ width: '100%', accentColor: severityColors[form.severity] }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
              <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What happened? Be specific..."
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,51,102,0.03)',
                border: '1px solid rgba(255,51,102,0.2)', borderRadius: '6px',
                padding: '10px 14px', color: 'white', resize: 'none',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Location */}
          <div style={{ marginBottom: '20px' }}>
            <button type="button" onClick={getLocation} disabled={gettingLocation} style={{
              width: '100%', padding: '12px',
              background: form.location ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${form.location ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '6px', color: form.location ? '#00ff88' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
            }}>
              {gettingLocation ? '📡 Getting location...' :
                form.location ? `📍 ${form.location.lat.toFixed(4)}, ${form.location.lng.toFixed(4)}` :
                  '📍 CAPTURE MY LOCATION'}
            </button>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, rgba(255,51,102,0.3), rgba(255,100,0,0.2))',
            border: '1px solid rgba(255,51,102,0.5)', borderRadius: '6px',
            color: 'white', fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px', fontWeight: 600, textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            letterSpacing: '0.08em',
          }}>
            {loading ? 'REPORTING...' : '🚨 REPORT INCIDENT'}
          </button>
        </form>
      </div>

      {/* Recent Nearby Incidents */}
      {incidents.length > 0 && (
        <>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '20px 0 12px' }}>
            {incidents.length} NEARBY INCIDENT{incidents.length !== 1 ? 'S' : ''}
          </div>
          {incidents.slice(0, 5).map((inc, i) => {
            const t = INCIDENT_TYPES.find(x => x.value === inc.type) || INCIDENT_TYPES[5];
            return (
              <div key={i} style={{ ...cardStyle, borderColor: `${t.color}33` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: t.color, fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{t.label}</div>
                    {inc.description && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{inc.description}</div>}
                  </div>
                  <div style={{
                    background: `${severityColors[inc.severity] || '#888'}22`,
                    border: `1px solid ${severityColors[inc.severity] || '#888'}`,
                    borderRadius: '4px', padding: '2px 8px',
                    color: severityColors[inc.severity] || '#888',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                  }}>
                    SEV {inc.severity}
                  </div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
                  {inc.upvotes || 0} confirmations · {new Date(inc.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default IncidentReport;
