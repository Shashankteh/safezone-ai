import React, { useState } from 'react';
import api from '../../services/api';

const INCIDENT_TYPES = ['theft', 'assault', 'accident', 'harassment', 'suspicious', 'other'];

const IncidentManager = ({ location }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'theft', description: '', severity: 2 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!location?.lat || !location?.lng) {
      setError('Location not available. Enable GPS and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/api/incident/report', {
        type: form.type,
        description: form.description,
        lat: location.lat,
        lng: location.lng,
        severity: form.severity
      });

      setSuccess(`✅ Incident reported! ${data.data.nearbyNotified} nearby users notified.`);
      setForm({ type: 'theft', description: '', severity: 2 });
      setShowForm(false);

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report incident');
    } finally {
      setLoading(false);
    }
  };

  const severityLabels = { 1: '🟡 Low', 2: '🟠 Medium', 3: '🔴 High' };

  return (
    <div className="incident-manager">
      {success && <div className="im-success">{success}</div>}

      <button className="report-btn" onClick={() => setShowForm(!showForm)}>
        ⚠️ Report Incident
      </button>

      {showForm && (
        <div className="im-form">
          <h4>Report Safety Incident</h4>

          <div className="field">
            <label>Incident Type</label>
            <div className="type-grid">
              {INCIDENT_TYPES.map(t => (
                <button
                  key={t}
                  className={`type-option ${form.type === t ? 'active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, type: t }))}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Severity</label>
            <div className="severity-row">
              {[1, 2, 3].map(s => (
                <button
                  key={s}
                  className={`sev-btn ${form.severity === s ? 'active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, severity: s }))}
                >
                  {severityLabels[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Description (optional)</label>
            <textarea
              placeholder="Brief description of what happened..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="location-note">
            📍 Will report at your current location
            {location && <span> ({location.lat?.toFixed(5)}, {location.lng?.toFixed(5)})</span>}
          </div>

          {error && <p className="im-error">{error}</p>}

          <div className="form-btns">
            <button className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="submit-btn" onClick={submit} disabled={loading}>
              {loading ? 'Submitting...' : '📣 Report Now'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .incident-manager { position: relative; }
        .im-success { background: rgba(16,185,129,0.15); border: 1px solid #10b981; border-radius: 8px; padding: 8px 12px; color: #34d399; font-size: 12px; margin-bottom: 8px; }
        .report-btn { width: 100%; padding: 10px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); border-radius: 10px; color: #fbbf24; font-size: 13px; font-weight: 600; cursor: pointer; }
        .report-btn:hover { background: rgba(245,158,11,0.25); }
        .im-form { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 12px; padding: 16px; margin-top: 8px; }
        .im-form h4 { margin: 0 0 12px; color: #e2e8f0; font-size: 14px; }
        .field { margin-bottom: 12px; }
        .field label { display: block; color: #94a3b8; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; }
        .type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
        .type-option { padding: 6px; border: 1px solid #2d2d3e; border-radius: 6px; background: #0f0f1a; color: #94a3b8; font-size: 11px; cursor: pointer; text-transform: capitalize; }
        .type-option.active { background: rgba(245,158,11,0.2); border-color: #f59e0b; color: #fbbf24; }
        .severity-row { display: flex; gap: 6px; }
        .sev-btn { flex: 1; padding: 6px; border: 1px solid #2d2d3e; border-radius: 6px; background: #0f0f1a; color: #94a3b8; font-size: 11px; cursor: pointer; }
        .sev-btn.active { background: rgba(245,158,11,0.2); border-color: #f59e0b; color: #fbbf24; }
        .im-form textarea { width: 100%; padding: 8px; background: #0f0f1a; border: 1px solid #2d2d3e; border-radius: 6px; color: #e2e8f0; font-size: 12px; resize: none; box-sizing: border-box; font-family: inherit; }
        .location-note { font-size: 11px; color: #64748b; margin-bottom: 10px; }
        .im-error { color: #f87171; font-size: 11px; margin: 0 0 8px; }
        .form-btns { display: flex; gap: 8px; }
        .cancel-btn { flex: 1; padding: 8px; background: none; border: 1px solid #2d2d3e; border-radius: 8px; color: #94a3b8; cursor: pointer; font-size: 12px; }
        .submit-btn { flex: 2; padding: 8px; background: #f59e0b; border: none; border-radius: 8px; color: #000; font-size: 12px; font-weight: 700; cursor: pointer; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default IncidentManager;
